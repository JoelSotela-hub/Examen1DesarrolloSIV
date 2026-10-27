import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * TODO [F3] Formulario de registro de equipos.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  // 1. Cargar categorías en el <select>
  listarCategorias()
    .then(({ data: categorias }) => {
      categorias.forEach((cat) => {
        const $option = document.createElement("option");
        $option.value = cat.id;
        $option.textContent = cat.nombre;
        $selectCategoria.appendChild($option);
      });
    })
    .catch(() => {
      mostrarMensaje("error", "No se pudieron cargar las categorías.");
    });

  // 2. Manejar el envío del formulario
  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Limpiar errores previos
    $form.querySelectorAll("[data-error]").forEach(($p) => ($p.textContent = ""));
    $form.querySelectorAll("[aria-invalid]").forEach(($campo) => $campo.removeAttribute("aria-invalid"));

    // Construir datos desde FormData, convirtiendo campos numéricos
    const formData = new FormData($form);
    const datos = Object.fromEntries(formData.entries());
    datos.categoria_id = Number(datos.categoria_id);
    datos.costo_interno = Number(datos.costo_interno);

    // Deshabilitar botón mientras guarda
    $btnGuardar.disabled = true;
    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.textContent = "Guardando…";

    try {
      const equipo = await crearEquipo(datos);
      mostrarMensaje("exito", `Equipo ${equipo.codigo ?? datos.codigo} registrado.`);
      $form.reset();
      alGuardar();
    } catch (error) {
      if (error.status === 422) {
        for (const [campo, mensajes] of Object.entries(error.datos?.errors ?? {})) {
          const $errorP = $form.querySelector(`[data-error="${campo}"]`);
          if ($errorP) $errorP.textContent = mensajes[0];
          const $campo = $form.querySelector(`[name="${campo}"]`);
          if ($campo) $campo.setAttribute("aria-invalid", "true");
        }
      } else {
        mostrarMensaje("error", error.message ?? "Error al guardar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};

