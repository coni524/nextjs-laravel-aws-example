FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    nginx \
    default-mysql-client

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Create a new Laravel installation in /tmp
RUN composer create-project laravel/laravel:10.* /tmp/laravel --prefer-dist

# Copy the entire Laravel installation
RUN cp -r /tmp/laravel/. /var/www/html/

# Remove the temporary Laravel installation
RUN rm -rf /tmp/laravel

# Copy our custom files
COPY src/Controllers/* app/Http/Controllers/
COPY src/Models/* app/Models/
COPY src/migrations/* database/migrations/
COPY routes/api.php routes/

# Remove default Nginx configs
RUN rm -f /etc/nginx/sites-enabled/default \
    && rm -f /etc/nginx/sites-available/default

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini

# Copy scripts
COPY docker/entrypoint.sh /usr/local/bin/
COPY docker/start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/start.sh

# Configure environment
RUN sed -i 's/DB_CONNECTION=mysql/DB_CONNECTION=mysql/' .env \
    && sed -i 's/DB_HOST=127.0.0.1/DB_HOST=db/' .env \
    && sed -i 's/DB_DATABASE=laravel/DB_DATABASE=laravel_db/' .env \
    && sed -i 's/DB_USERNAME=root/DB_USERNAME=admin/' .env \
    && sed -i 's/DB_PASSWORD=/DB_PASSWORD=password/' .env

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Install dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Generate application key and clear caches
RUN php artisan key:generate \
    && php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/start.sh"]