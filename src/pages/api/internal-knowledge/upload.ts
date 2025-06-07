import { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '@/lib/services/persistentRAGService';
import multer from 'multer';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// Multer設定
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Image and video files only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('画像または動画ファイルのみアップロード可能です'));
    }
  }
});

const uploadSingle = promisify(upload.single('file'));

// Next.js API config
export const config = {
  api: {
    bodyParser: false,
  },
};

// 画像からテキスト抽出（シンプルなメタデータ抽出）
function extractImageText(filePath: string, fileName: string): string {
  // 実際の実装では、OCRライブラリ（Tesseract.jsなど）を使用
  // ここではファイル名とメタデータから簡単なテキストを生成
  return `画像ファイル: ${fileName}
ファイルパス: ${filePath}
アップロード日時: ${new Date().toLocaleString('ja-JP')}
説明: この画像には重要な技術情報が含まれている可能性があります。`;
}

// 動画からテキスト抽出（メタデータ + 仮の文字起こし）
function extractVideoText(filePath: string, fileName: string): string {
  // 実際の実装では、音声認識API（OpenAI Whisper、Google Speech-to-Textなど）を使用
  // ここではファイル名とメタデータから簡単なテキストを生成
  return `動画ファイル: ${fileName}
ファイルパス: ${filePath}
アップロード日時: ${new Date().toLocaleString('ja-JP')}
説明: この動画には技術的な解説や手順が含まれている可能性があります。
音声文字起こし: [自動文字起こし機能は今後実装予定]`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Handle file upload
    await uploadSingle(req as any, res as any);

    const file = (req as any).file;
    const { mediaType, department, accessLevel = 'company' } = req.body;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'ファイルがアップロードされませんでした' 
      });
    }

    console.log('📁 Processing uploaded file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      mediaType
    });

    // Extract text content based on media type
    let content: string;
    let transcription: string | undefined;

    if (file.mimetype.startsWith('image/')) {
      content = extractImageText(file.path, file.originalname);
    } else if (file.mimetype.startsWith('video/')) {
      content = extractVideoText(file.path, file.originalname);
      transcription = '[自動文字起こし機能は今後実装予定]';
    } else {
      throw new Error('サポートされていないファイル形式です');
    }

    // Add to Internal Knowledge
    const documentId = await PersistentRAGService.addInternalKnowledge(content, {
      source: 'file_upload',
      type: `internal_${mediaType}` as any,
      department,
      accessLevel,
      mediaType: mediaType as 'text' | 'image' | 'video',
      mediaUrl: `/uploads/${file.filename}`, // Relative URL for serving
      fileName: file.originalname,
      fileSize: file.size,
      transcription
    });

    console.log(`✅ File uploaded and added to Internal Knowledge: ${documentId}`);

    res.status(200).json({
      success: true,
      id: documentId,
      message: `${mediaType === 'image' ? '画像' : '動画'}が正常にアップロードされました`,
      fileInfo: {
        originalName: file.originalname,
        fileName: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'ファイルアップロードに失敗しました'
    });
  }
} 