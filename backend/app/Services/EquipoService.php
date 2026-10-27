<?php

namespace App\Services;

use App\Exceptions\ReglaNegocioException;
use App\Models\Equipo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * TODO [B2] Capa de negocio de equipos.
 *
 * Esta clase NO conoce HTTP: no use request(), response(), abort() ni códigos
 * de estado aquí. Cuando una regla del dominio lo impida, lance
 * ReglaNegocioException con un mensaje en español.
 *
 * Reglas de negocio exigidas:
 *  R1. No se puede eliminar un equipo que está prestado.
 *      Mensaje: "No se puede eliminar un equipo prestado."
 *  R2. Solo se puede prestar un equipo disponible.
 *      - Si está en mantenimiento: "No se puede prestar un equipo en mantenimiento."
 *      - Si ya está prestado:     "El equipo ya se encuentra prestado."
 */
class EquipoService
{
    /**
     * Listado paginado con la categoría cargada de forma anticipada (sin N+1),
     * ordenado por código. Filtros opcionales:
     *  - $q:      busca en código o nombre (coincidencia parcial)
     *  - $estado: filtra por estado exacto
     */
    public function listar(?string $q, ?string $estado, int $porPagina): LengthAwarePaginator
    {
        return Equipo::query()
            ->with('categoria')
            ->when($q, function ($query, $q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('codigo', 'like', "%{$q}%")
                        ->orWhere('nombre', 'like', "%{$q}%");
                });
            })
            ->when($estado, fn ($query, $estado) => $query->where('estado', $estado))
            ->orderBy('codigo')
            ->paginate($porPagina);
    }

    public function crear(array $datos): Equipo
    {
        $equipo = Equipo::create($datos);

        return $equipo->load('categoria');
    }

    public function actualizar(Equipo $equipo, array $datos): Equipo
    {
        $equipo->update($datos);

        return $equipo->load('categoria');
    }

    public function eliminar(Equipo $equipo): void
    {
        // R1: no se puede eliminar un equipo que está prestado
        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException(
                'No se puede eliminar un equipo que está prestado.'
            );
        }

        $equipo->delete();
    }

    public function prestar(Equipo $equipo): Equipo
    {
         // R2: solo se puede prestar un equipo disponible
        if ($equipo->estado !== 'disponible') {
            throw new ReglaNegocioException(
                'Solo se pueden prestar equipos en estado disponible.'
            );
        }

        $equipo->update(['estado' => 'prestado']);

        return $equipo->load('categoria');
    }
}
