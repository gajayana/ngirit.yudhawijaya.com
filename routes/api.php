<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Route::middleware('auth:api')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::group( ['middleware' => ['auth:api'] ], function () {
    Route::get('pengguna/{uuid}', 'Api\UserController@get');
    
    Route::group(['prefix' => 'pengeluaran'], function() {
        Route::get('/', 'Api\SpendingController@fetch');
        Route::post('/', 'Api\SpendingController@create');
        Route::put('/', 'Api\SpendingController@update');
    });
});