<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Auth;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Validator;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
     *
     * @var string
     */
    protected $redirectTo = '/';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct() {
        $this->middleware('guest')->except('logout');
    }

    public function login(Request $request) {
        $inputs = $request->all();
        $rules = [
            'email' => 'required|email',
            'password' => 'required|min:6|max:191',
            'remember' => 'present|boolean',
        ];
        $validator = Validator::make( $inputs, $rules );

        if ( $validator->fails() ) {
            return response()->json( [
                'status' => 'error',
                'messages' => $validator->errors(),
            ] );
        } else {
            $email = strip_tags($request->email);
            $password = strip_tags($request->password);
            if (Auth::attempt( [ 'email' => $email, 'password' => $password ], $request->remember )) {
                return response()->json( [
                    'status' => 'success',
                    'messages' => [],
                ] );
            } else {
                return response()->json([
                    'status' => 'error',
                    'messages' => [
                        'password' => [ 'Kemungkinan besar sandi Anda juga salah' ],
                        'email' => [ 'Kemungkinan besar nama pengguna Anda salah' ],
                    ],
                ]);
            }
        }
    }
}
