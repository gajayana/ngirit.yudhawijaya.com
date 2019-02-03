<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function get( $uuid = null ) {
        if (!$uuid) return;
        $res = User::find($uuid);
        return response()->json( $res );
    }
}
