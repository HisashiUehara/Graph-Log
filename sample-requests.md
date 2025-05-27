# フィールドエンジニアアプリ テスト方法

## 概要

このドキュメントでは、フィールドエンジニア向けアプリケーションのAPIエンドポイントを使用したテスト方法を説明します。

## 前提条件

- Node.jsとnpmがインストールされていること
- OpenAI APIキーが設定されていること（`.env`ファイルまたは環境変数として）
- 開発サーバーが起動していること（`npm run dev`）

## APIエンドポイント

メインエンドポイント: `http://localhost:3000/api/field-engineer`

## テストリクエスト例

### 1. ログ分析リクエスト

```bash
curl -X POST http://localhost:3000/api/field-engineer \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "analyze",
    "logData": "2023-05-15 08:30:22 ERROR [SystemMonitor] CPU usage exceeded threshold: 95%\n2023-05-15 08:30:25 WARNING [MemoryManager] Available memory: 512MB\n2023-05-15 08:31:05 ERROR [NetworkController] Connection timeout to server db-01\n2023-05-15 08:32:10 INFO [SystemMonitor] Service restarted\n2023-05-15 08:35:00 INFO [NetworkController] Connection established to server db-01"
  }'
```

### 2. メディア処理リクエスト

```bash
curl -X POST http://localhost:3000/api/field-engineer \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "analyze",
    "mediaFiles": [
      {
        "type": "image",
        "url": "https://example.com/equipment-photo.jpg",
        "filename": "equipment-photo.jpg",
        "metadata": {
          "timestamp": "2023-05-15T12:30:45Z",
          "location": "Factory Floor B"
        }
      }
    ]
  }'
```

### 3. RAG検索リクエスト

```bash
curl -X POST http://localhost:3000/api/field-engineer \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "search",
    "query": "サーバー接続エラーの対処法について教えてください"
  }'
```

### 4. レポート生成リクエスト

```bash
curl -X POST http://localhost:3000/api/field-engineer \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "generateReport",
    "reportContext": {
      "title": "現場点検レポート：東京第二工場",
      "date": "2023-05-15",
      "engineer": "山田太郎",
      "location": "東京都大田区",
      "equipment": "製造ライン #3",
      "requestNumber": "SR-2023-0588"
    }
  }'
```

### 5. 複合リクエスト（ログとメディア）

```bash
curl -X POST http://localhost:3000/api/field-engineer \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "analyze",
    "logData": "2023-05-15 08:30:22 ERROR [SystemMonitor] CPU usage exceeded threshold: 95%\n2023-05-15 08:30:25 WARNING [MemoryManager] Available memory: 512MB\n2023-05-15 08:31:05 ERROR [NetworkController] Connection timeout to server db-01",
    "mediaFiles": [
      {
        "type": "image",
        "url": "https://example.com/server-rack.jpg",
        "filename": "server-rack.jpg",
        "metadata": {
          "timestamp": "2023-05-15T08:35:00Z",
          "location": "Server Room A"
        }
      }
    ],
    "reportContext": {
      "customer": "ABC株式会社",
      "system": "在庫管理システム",
      "priority": "高"
    }
  }'
```

## Postmanを使用したテスト

1. Postmanを起動し、新しいリクエストを作成
2. メソッドを`POST`に設定
3. URLに`http://localhost:3000/api/field-engineer`を入力
4. 「Body」タブを選択し、「raw」を選択、形式を「JSON」に設定
5. 上記のサンプルJSONデータを貼り付け
6. 「Send」ボタンをクリック

## フロントエンドからのリクエスト例

```javascript
async function sendAnalysisRequest() {
  try {
    const response = await fetch('/api/field-engineer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'analyze',
        logData: '2023-05-15 08:30:22 ERROR [SystemMonitor] CPU usage exceeded threshold: 95%',
        mediaFiles: [
          {
            type: 'image',
            url: 'https://example.com/equipment-photo.jpg',
            filename: 'equipment-photo.jpg',
          }
        ]
      }),
    });
    
    const result = await response.json();
    console.log('Analysis result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
``` 