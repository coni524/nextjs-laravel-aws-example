#!/bin/sh

# 環境変数が設定されているか確認
if [ -z "$DB_HOST" ] || [ -z "$DB_DATABASE" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: Database environment variables are not set"
    exit 1
fi

# データベース接続の確認
echo "Waiting for database connection..."
while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent; do
    echo "Waiting for database connection..."
    sleep 2
done

# Laravelの.env file更新
sed -i "s|DB_HOST=.*|DB_HOST=${DB_HOST}|g" .env
sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE}|g" .env
sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME}|g" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|g" .env

# キャッシュクリア
php artisan config:clear
php artisan cache:clear

# マイグレーションの実行
php artisan migrate --force

# 権限の確認と修正
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html/storage
chmod -R 755 /var/www/html/bootstrap/cache

# コマンドの実行
exec "$@"