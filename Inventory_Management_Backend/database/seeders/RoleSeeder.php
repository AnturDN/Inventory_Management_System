<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Faker\Factory as Faker;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $permissionOptions = ['create', 'edit', 'view', 'delete', 'export', 'import'];

        for ($i = 0; $i < 500; $i++) {
            // Randomly pick 2-5 permissions
            $permissions = collect($permissionOptions)
                ->random(rand(2, 5))
                ->implode(',');

            Role::create([
                'role_name'   => $faker->unique()->jobTitle,
                'permissions' => $permissions,
                'status'      => $faker->boolean(90), // 90% chance true
            ]);
        }
    }
}
