<?php

namespace App\Traits;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasRoles
{
    public function roles(): MorphToMany
    {
        return $this->morphToMany(Role::class, 'model', 'model_has_roles');
    }

    public function assignRole(string|Role $role): void
    {
        $roleObj = is_string($role) ? Role::where('name', $role)->firstOrFail() : $role;
        $this->roles()->syncWithoutDetaching([$roleObj->id]);
    }

    public function hasRole(string|array $roles): bool
    {
        $roleList = (array) $roles;

        if ($this->relationLoaded('roles')) {
            return $this->roles->contains(fn ($r) => in_array($r->name, $roleList, true));
        }

        return $this->roles()->whereIn('name', $roleList)->exists();
    }

    public function hasPermissionTo(string $permissionName): bool
    {
        if ($this->hasRole('admin')) {
            return true;
        }

        if ($this->relationLoaded('roles')) {
            foreach ($this->roles as $role) {
                if ($role->relationLoaded('permissions')) {
                    if ($role->permissions->contains('name', $permissionName)) {
                        return true;
                    }
                } else {
                    if ($role->permissions()->where('name', $permissionName)->exists()) {
                        return true;
                    }
                }
            }
            return false;
        }

        return $this->roles()->whereHas('permissions', function ($query) use ($permissionName) {
            $query->where('name', $permissionName);
        })->exists();
    }
}
