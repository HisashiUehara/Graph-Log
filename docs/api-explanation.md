# APIエンドポイントの解説

## APIって何？

APIは、**アプリ同士が話をするための窓口**のようなものです。

### 身近な例：レストランの注文

**お客さん**（あなたのアプリ）が**レストラン**（サーバー）に注文する時：

1. **メニューを見る**（どんなAPIがあるか確認）
2. **注文する**（APIにリクエストを送る）
3. **料理が出てくる**（APIから結果が返ってくる）

## エンドポイントって何？

エンドポイントは、**具体的な注文窓口**のことです。

### レストランの例

- `/pizza` → ピザ専門の窓口
- `/sushi` → お寿司専門の窓口  
- `/dessert` → デザート専門の窓口

### 今回作ったエンドポイント

- `/api/simple-test` → 簡単なテスト用
- `/api/simple-field-engineer` → シンプルなログ分析
- `/api/advanced-field-engineer` → 高度なログ分析

## 実際のAPIファイルを見てみよう

`advanced-field-engineer.ts`を分解して説明します：

### 1. 基本設定
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { GraphAIManager } from '../../lib/utils/GraphAIManager';
```

**解説**:
- `NextApiRequest`: 注文書（リクエスト）の形式
- `NextApiResponse`: 返事（レスポンス）の形式
- `GraphAIManager`: GraphAIを使うためのツール

### 2. メイン関数
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
```

これは**店員さん**のような役割。お客さんの注文を受けて、料理を作って、返してくれます。

### 3. 注文方法のチェック
```typescript
if (req.method !== 'POST') {
  return res.status(405).json({ error: 'Method not allowed' });
}
```

**解説**:
- `POST`という方法でしか注文を受け付けない
- 違う方法で来たら「その注文方法はダメです」と返す

### 4. 注文内容を受け取る
```typescript
const { 
  query = '', 
  logData = '',
  requestType = 'analyze'
} = req.body;
```

**解説**:
- お客さんが送ってきたデータを受け取る
- `query`: 質問
- `logData`: ログデータ
- `requestType`: 処理の種類

### 5. 注文内容をチェック
```typescript
if (!query && !logData) {
  return res.status(400).json({ 
    error: 'At least one of query or logData is required' 
  });
}
```

**解説**:
- 質問もログデータも空っぽだったら「何か入力してください」と返す

### 6. 実際の処理
```typescript
const graphAIManager = new GraphAIManager();
const result = await graphAIManager.runWorkflow('advanced-field-engineer', inputs);
```

**解説**:
- GraphAIManagerを使って、ワークフローを実行
- `advanced-field-engineer`という名前のワークフローを動かす

### 7. 結果を返す
```typescript
res.status(200).json({
  success: true,
  result,
  metadata: {
    type: 'advanced-field-engineer',
    timestamp: new Date().toISOString(),
    features: ['ログ分析', 'エラー抽出', '知識ベース検索', 'レポート生成']
  }
});
```

**解説**:
- `200`: 成功しました！
- `result`: 実際の結果
- `metadata`: おまけ情報（いつ処理したか、どんな機能があるかなど）

## 使い方

実際にAPIを使うには、こんな感じでリクエストを送ります：

```bash
curl -X POST http://localhost:3002/api/advanced-field-engineer \
  -H "Content-Type: application/json" \
  -d '{"logData":"ERROR: システムエラー", "query":"何が問題ですか？"}'
```

これは**電話で注文する**ようなものです！ 