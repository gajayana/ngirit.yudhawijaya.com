<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Spending;
use Carbon\Carbon;
use Validator;

class SpendingController extends Controller
{
    private $rules;

    public function __construct() {
        $this->rules = [
            'amount' => 'required|numeric',
            'label' => 'required|string|max:191',
            'user' => 'required|uuid',
        ];
    }
    
    public function create(Request $request) {
        $inputs = $request->all();
        $res = [];
        $validator = Validator::make($inputs, $this->rules);

        if ( $validator->fails() ) {
            $res = (object)[
                'status'    =>  'error',
                'messages'  =>  $validator->errors()
            ];
        } else {
            $model = Spending::create([
                'amount' => strip_tags($request->amount),
                'label' => strip_tags($request->label),
                'user' => $request->user,
            ]);
            $res = $model->parse();
        }

        return response()->json($res);
    }

    public function fetch() {
        $currentMonth = Carbon::now()->format('m');
        $model = Spending::whereRaw('MONTH(created_at) = ?',[$currentMonth])->get();//whereDate('created_at', Carbon::today())->get();
        $res = [];

        foreach( $model as $item ) {
            $res[] = $item->parse();
        }

        return response()->json( $res );
    }

    public function update() {}
}
