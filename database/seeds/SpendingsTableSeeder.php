<?php

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\User;

class SpendingsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create();
        
        // truncate table
        DB::table('spendings')->truncate();

        // loop
        for( $i = 0; $i <= 777; $i++) {
            $user = User::inRandomOrder()->first();
            DB::table('spendings')->insert([
                'amount' => $faker->numberBetween($min = 1000, $max = 199000),
                'label' => $faker->words(3, true),
                'user' => $user->id,
                'created_at' => $faker->dateTimeBetween('-1 month', $max = 'now', 'UTC'),
                'updated_at' => $faker->dateTimeBetween('-1 month', $max = 'now', 'UTC'),
            ]);
        }
    }
}
