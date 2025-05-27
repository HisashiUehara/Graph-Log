# ワークフロー（作業の流れ）の解説

## ワークフローって何？

ワークフローは、**作業の手順書**のようなものです。

### 身近な例：朝の準備

```
起きる → 顔を洗う → 歯を磨く → 着替える → 朝ごはん → 学校へ
```

この順番を間違えると大変ですよね？（着替える前に朝ごはんを食べたら服が汚れちゃう！）

## JSONファイルって何？

JSONは、**コンピューターが理解しやすい形で情報を書く方法**です。

### 普通の文章 vs JSON

**普通の文章**:
「田中さんは15歳で、趣味は読書です」

**JSON**:
```json
{
  "名前": "田中",
  "年齢": 15,
  "趣味": "読書"
}
```

JSONの方が、コンピューターには分かりやすいんです。

## 実際のワークフローを見てみよう

今回作った`advanced-field-engineer.json`を分解して説明します：

### 1. 基本情報
```json
{
  "version": 0.5,
  "nodes": {
    // ここに作業の内容を書く
  }
}
```

- `version`: GraphAIのバージョン
- `nodes`: 作業の一つ一つ（ノード）

### 2. 最初のデータ（source）
```json
"source": {
  "value": {
    "query": "",
    "logData": "",
    "requestType": "analyze"
  }
}
```

これは**材料置き場**のようなもの。ユーザーからもらったデータを置いておきます。

### 3. ログを分割する作業（logSplitter）
```json
"logSplitter": {
  "agent": "stringSplitterAgent",
  "inputs": {
    "text": ":source.logData"
  },
  "params": {
    "separator": "\n"
  },
  "if": ":source.logData",
  "isResult": true
}
```

**解説**:
- `agent`: 使うエージェント（文字列分割の専門家）
- `inputs`: 材料（sourceからlogDataをもらう）
- `params`: 設定（改行で分割する）
- `if`: 条件（logDataがある時だけ実行）
- `isResult`: 結果として保存する

### 4. エラーを探す作業（errorFilter）
```json
"errorFilter": {
  "agent": "propertyFilterAgent",
  "inputs": {
    "item": ":logSplitter.contents"
  },
  "params": {
    "filterFunction": "item => item.toLowerCase().includes('error') || item.toLowerCase().includes('warning')"
  },
  "if": ":logSplitter",
  "isResult": true
}
```

**解説**:
- 前の作業（logSplitter）の結果を受け取る
- 「error」や「warning」が含まれる行だけを選び出す

## データの流れ

```
ユーザーの入力
    ↓
source（データ置き場）
    ↓
logSplitter（ログを行ごとに分割）
    ↓
errorFilter（エラー行だけを抽出）
    ↓
logAnalysis（分析結果を作成）
    ↓
finalReport（最終レポート作成）
```

まるで**ベルトコンベア**のように、データが順番に処理されていきます！ 