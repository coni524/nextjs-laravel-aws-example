<?php

use App\Http\Controllers\SampleController;
use Illuminate\Support\Facades\Route;

Route::get('/samples', [SampleController::class, 'index']);
// routes/api.php
Route::get('/health', [SampleController::class, 'health'])->name('health.check');

