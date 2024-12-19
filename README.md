# Next.js + Laravel Example with AWS CDK

Next.js（フロントエンド）とLaravel（バックエンド）を組み合わせたAWS CDKサンプルプロジェクトです。

## アーキテクチャ

![Architecture](assets/architecture.svg)

### コンポーネント
- **フロントエンド**: Next.js（SSRとスタティックページ）
- **バックエンド**: Laravel API
- **データベース**: Amazon RDS (MySQL)
- **インフラストラクチャ**:
  - Amazon ECS Fargate（Next.jsとLaravelのコンテナ実行）
  - Application Load Balancer
  - Amazon CloudFront（CDN）
  - Amazon RDS for MySQL
  - AWS Secrets Manager（データベース認証情報）

## 前提条件

- Node.js (v18以上)
- AWS CLI（設定済み）
- Docker Desktop

## ローカル開発環境の起動

1. 環境変数の設定
```bash
# .env.exampleをコピーして.envファイルを作成
cp .env.example .env

# .envファイルを編集し、必要な値を設定
# - APP_KEY（Laravelアプリケーションキー,そのままでもよい）
# - DB_PASSWORD（データベースパスワード、そのままでもよい）
```

2. ローカル環境の起動
```bash
# Docker Composeを使用してローカル環境を起動
docker-compose up
```

以下のサービスが起動します：
- Next.js: http://localhost:3000
- Laravel API: http://localhost:8080
- phpMyAdmin: http://localhost:8081
  - ユーザー名: admin
  - パスワード: .envで設定したDB_PASSWORDの値

## AWSへのデプロイ

1. AWSクレデンシャルの設定（初回のみ）
```bash
aws configure
```

2. CDKの初期化（初回のみ）
```bash
cdk bootstrap
```

3. アプリケーションのデプロイ
```bash
# プロジェクトの依存関係をインストール
npm install

# Next.jsアプリケーションのビルド
cd nextjs
npm install
npm run build
cd ..

# デプロイの実行
cdk deploy
```

デプロイ完了後、CloudFrontのドメインが出力されます。

## エンドポイント

- **フロントエンド**: CloudFrontドメイン
  - `/` - トップページ
  - `/samples` - サンプルデータ表示
- **API**: `/api/samples` - サンプルデータAPI

## 開発のヒント

- ソースコードを変更すると、ホットリロードにより自動的に反映されます
- データベースの管理はphpMyAdmin（http://localhost:8081）から行えます
- コンテナのログは`docker-compose logs -f [サービス名]`で確認できます
- 開発環境の再構築が必要な場合: `docker-compose down -v && docker-compose up --build`

## トラブルシューティング

1. コンテナが起動しない場合
   - `.env`ファイルが正しく設定されているか確認
   - `docker-compose down -v`を実行してボリュームをクリアしてから再試行

2. データベース接続エラー
   - `.env`のデータベース認証情報が正しいか確認
   - MySQLコンテナが完全に起動するまで待つ（数秒かかる場合があります）

## 課題やフィードバック

問題やフィードバックは、GitHubのIssuesでお知らせください。

## ライセンス

[MIT License](LICENSE)