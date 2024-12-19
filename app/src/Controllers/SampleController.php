<?php

namespace App\Http\Controllers;

use App\Models\Sample;
use Illuminate\Http\JsonResponse;

class SampleController extends Controller
{
    public function index(): JsonResponse
    {
        $samples = Sample::all();
        return response()->json([
            'status' => 'success',
            'data' => $samples
        ]);
    }

    // ヘルスチェック用エンドポイント
    public function health(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }
}