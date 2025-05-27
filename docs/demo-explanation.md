# 実際の動作デモ

## どんなことができるの？

今回作ったアプリは、**機械の故障を自動で分析してくれる**アプリです。

### 想像してみよう

あなたが**コンピューターの修理屋さん**だとします。
お客さんから「パソコンが調子悪いんです」と言われて、こんなログ（記録）をもらいました：

```
2023-05-15 08:30:22 ERROR [SystemMonitor] CPU usage exceeded threshold: 95%
2023-05-15 08:30:25 WARNING [MemoryManager] Available memory: 512MB
2023-05-15 08:31:05 ERROR [NetworkController] Connection timeout to server db-01
2023-05-15 08:32:10 INFO [SystemMonitor] Service restarted
```

普通なら、この記録を一行ずつ読んで、問題を探して、解決方法を考えて...とても時間がかかりますよね？

でも、今回作ったアプリなら**一瞬で分析**してくれます！

## 実際にテストしてみよう

### 1. アプリに質問を送る

```bash
curl -X POST http://localhost:3002/api/advanced-field-engineer \
  -H "Content-Type: application/json" \
  -d '{
    "logData": "2023-05-15 08:30:22 ERROR [SystemMonitor] CPU usage exceeded threshold: 95%\n2023-05-15 08:30:25 WARNING [MemoryManager] Available memory: 512MB\n2023-05-15 08:31:05 ERROR [NetworkController] Connection timeout to server db-01\n2023-05-15 08:32:10 INFO [SystemMonitor] Service restarted",
    "query": "このログから問題を特定して解決策を教えて"
  }'
```

### 2. アプリの中で何が起こるか

#### ステップ1: ログを分割
```
元のログ:
"ERROR CPU使用率95%\nWARNING メモリ512MB\nERROR 接続タイムアウト\nINFO サービス再起動"

↓ stringSplitterAgent が働く

分割後:
[
  "ERROR CPU使用率95%",
  "WARNING メモリ512MB", 
  "ERROR 接続タイムアウト",
  "INFO サービス再起動"
]
```

#### ステップ2: エラーだけを抽出
```
全ての行:
["ERROR CPU使用率95%", "WARNING メモリ512MB", "ERROR 接続タイムアウト", "INFO サービス再起動"]

↓ propertyFilterAgent が働く（ERRORとWARNINGだけを選ぶ）

エラー行だけ:
["ERROR CPU使用率95%", "WARNING メモリ512MB", "ERROR 接続タイムアウト"]
```

#### ステップ3: 分析レポートを作成
```
stringTemplateAgent が働いて、こんなレポートを作成:

"ログ分析結果:
総行数: 4行
エラー/警告行数: 3行

主要なエラー:
- ERROR CPU使用率95%
- WARNING メモリ512MB  
- ERROR 接続タイムアウト

推奨対処法:
1. CPU使用率の確認と最適化
2. メモリ使用量の監視
3. ネットワーク接続の確認
4. システムの再起動確認"
```

#### ステップ4: 知識ベースから関連情報を取得
```
copyAgent が知識ベースから関連情報を取得:

- CPU使用率対処法: CPU使用率が95%を超えた場合：1. プロセス確認 2. 不要サービス停止 3. システム再起動
- ネットワーク接続エラー: Connection timeout エラー：1. ネットワーク設定確認 2. ファイアウォール設定 3. DNS設定確認
- メモリ不足対処: Available memory不足：1. メモリ使用量確認 2. 不要プロセス終了 3. スワップ設定確認
```

#### ステップ5: 最終レポートを作成
```
stringTemplateAgent が全てをまとめて最終レポートを作成:

"=== フィールドエンジニア レポート ===

ログ分析結果:
総行数: 4行
エラー/警告行数: 3行
...

=== 関連知識ベース ===
- CPU使用率対処法: CPU使用率が95%を超えた場合：1. プロセス確認...
- ネットワーク接続エラー: Connection timeout エラー：1. ネットワーク設定確認...
- メモリ不足対処: Available memory不足：1. メモリ使用量確認...

=== 処理タイプ ===
analyze

=== 生成時刻 ===
2025-01-25T12:00:00.000Z"
```

## すごいところ

1. **自動化**: 人間がやると30分かかる作業が数秒で完了
2. **正確性**: 見落としがない
3. **一貫性**: いつも同じ品質の分析
4. **24時間対応**: 夜中でも働いてくれる
5. **学習可能**: 新しい知識を追加できる

まるで**とても優秀なアシスタント**が24時間働いてくれるようなものです！ 