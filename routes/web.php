<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::group( [ 'middleware' => [ 'web', 'guest' ] ], function() {
    
    Route::post( 'catat_masuk', 'Auth\LoginController@login');
    
} );

Route::get('/', function () {
    return view('home');
});



Auth::routes();

// Route::get('/home', 'HomeController@index')->name('home');
