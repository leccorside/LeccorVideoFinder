FROM php:8.3-cli-alpine

# Instalar dependências de sistema e extensões PHP necessárias
RUN apk add --no-cache \
    curl \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libxml2-dev \
    oniguruma-dev \
    mariadb-connector-c-dev \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo pdo_mysql bcmath mbstring xml zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json ./

COPY . .

EXPOSE 8000

ENV COMPOSER_POLICY_ADVISORIES_BLOCK=false

CMD ["sh", "-c", "if [ ! -f vendor/autoload.php ]; then composer update --no-interaction --prefer-dist --optimize-autoloader --no-audit; fi && php artisan key:generate --force || true && php artisan serve --host=0.0.0.0 --port=8000"]
