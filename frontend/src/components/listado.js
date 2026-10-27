import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/**
 * TODO [F2] Listado y paginación.
 */
export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");
  try {
    const respuesta = await listarEquipos(pagina, POR_PAGINA);
    const { data: equipos, meta } = respuesta;

    paginaActual = meta.current_page;
    ultimaPagina = meta.last_page;

    // Vaciar la lista
    $lista.innerHTML = "";

    if (equipos.length === 0) {
      const $vacio = document.createElement("li");
      $vacio.className = "vacio";
      $vacio.textContent = "No hay equipos registrados.";
      $lista.appendChild($vacio);
    } else {
      equipos.forEach((equipo) => {
        const clon = $plantilla.content.cloneNode(true);
        const $li = clon.querySelector("li");

        $li.dataset.id = equipo.id;
        $li.dataset.estado = equipo.estado;

        clon.querySelector(".codigo").textContent = equipo.codigo;
        clon.querySelector(".nombre").textContent = equipo.nombre;
        clon.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "";
        clon.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);
        clon.querySelector(".estado").textContent = equipo.estado;

        $lista.appendChild(clon);
      });
    }

    // Resumen y página actual
    $resumen.textContent = `Mostrando ${meta.from ?? 0}–${meta.to ?? 0} de ${meta.total}`;
    $paginaActual.textContent = `Página ${meta.current_page} de ${meta.last_page}`;

    // Habilitar/deshabilitar botones de paginación
    $btnAnterior.disabled = meta.current_page <= 1;
    $btnSiguiente.disabled = meta.current_page >= meta.last_page;
  } catch (error) {
    mostrarMensaje("error", error.message ?? "Error al cargar los equipos.");
  } finally {
    $lista.removeAttribute("aria-busy");
  }
};

/**
 * TODO [F4] Eliminación con manejo de reglas de negocio.
 */
const alHacerClicEnLista = async (evento) => {
  const $btnEliminar = evento.target.closest(".btn-eliminar");
  if (!$btnEliminar) return;

  const $tarjeta = $btnEliminar.closest("[data-id]");
  if (!$tarjeta) return;

  const id = $tarjeta.dataset.id;
  if (!confirm("¿Desea eliminar este equipo?")) return;

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado.");

    // Si era el último de la página y no es la primera, ir a la anterior
    const itemsEnPagina = $lista.querySelectorAll("[data-id]").length;
    if (itemsEnPagina === 1 && paginaActual > 1) {
      await cargarPagina(paginaActual - 1);
    } else {
      await cargarPagina(paginaActual);
    }
  } catch (error) {
    if (error.status === 409) {
      mostrarMensaje("error", error.datos?.mensaje ?? "No se puede eliminar el equipo.");
    } else {
      mostrarMensaje("error", error.message ?? "Error al eliminar el equipo.");
    }
  }
};

// Parcialmente implementado: complete el TODO de los botones de paginación.
export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  // [F2] Conectar botones de paginación
  $btnAnterior.addEventListener("click", () => cargarPagina(paginaActual - 1));
  $btnSiguiente.addEventListener("click", () => cargarPagina(paginaActual + 1));

  cargarPagina(1);
};

