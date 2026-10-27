<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use id;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $payload = [
        'codigo'            => 'EQ-0001',
        'nombre'            => 'Proyector Epson',
        'categoria_id'      => $categoria->id,
        'estado'            => 'disponible',
        'fecha_adquisicion' => '2024-01-15',
        'costo_interno'     => 1500.50,
    ];

    $response = $this->postJson('/api/equipos', $payload);

    $response->assertCreated()                       // 201
             ->assertJsonPath('data.codigo', 'EQ-0001')
             ->assertJsonPath('data.nombre', 'Proyector Epson')
             ->assertHeader('Location');

    $equipo = Equipo::where('codigo', 'EQ-0001')->first();
    expect($equipo)->not->toBeNull();
    expect($response->headers->get('Location'))
        ->toContain("/api/equipos/{$equipo->id}");
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $payload = [
        'codigo'            => 'INVALIDO',      // falla regex EQ-0000
        'nombre'            => 'AB',            // min:3
        'categoria_id'      =>  999999,          // no existe
        'estado'            => 'prestado',      // no permitido en store
        'fecha_adquisicion' => now()->addDay()->toDateString(), // futura
        'costo_interno'     => -5,              // min:0
    ];

    $response = $this->postJson('/api/equipos', $payload);

    $response->assertUnprocessable()                 // 422
             ->assertJsonValidationErrors([
                 'codigo',
                 'nombre',
                 'categoria_id',
                 'estado',
                 'fecha_adquisicion',
                 'costo_interno',
             ]);

    expect(Equipo::count())->toBe(0);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->create(['estado' => 'prestado']);

    $response = $this->deleteJson("/api/equipos/{$equipo->id}");

    $response->assertStatus(409)
             ->assertJsonPath('codigo', 'REGLA_NEGOCIO')
             ->assertJsonPath('mensaje', 'No se puede eliminar un equipo que está prestado.');

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id]);
});