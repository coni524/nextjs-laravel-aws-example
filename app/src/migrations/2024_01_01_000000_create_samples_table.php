<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateSamplesTable extends Migration
{
    public function up()
    {
        Schema::create('samples', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->timestamps();
        });

        // サンプルデータの挿入
        DB::table('samples')->insert([
            [
                'name' => 'サンプル1',
                'description' => 'これはサンプルデータ1です。',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'サンプル2',
                'description' => 'これはサンプルデータ2です。',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('samples');
    }
}