<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\User;

class Spending extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user', 
        'label', 
        'amount',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['deleted_at'];

    public function parse() {
        return (object)[
            'amount' => (int)$this->amount,
            'created_at' => $this->created_at->timezone('Asia/Jakarta')->toDateTimeString(),
            'id' => (int)$this->id,
            'label' => $this->label,
            'updated_at' => $this->updated_at->timezone('Asia/Jakarta')->toDateTimeString(),
            'user' => User::find($this->user)->parse(),
        ];
    }

}
