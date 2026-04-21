const API = "https://web-production-7c5f6.up.railway.app";
let token = localStorage.getItem("token");

function mostrarPantalla(id) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
    document.getElementById(id).classList.add("activa");
}

function guardarToken(t) {
    token = t;
    localStorage.setItem("token", t);
}

function cerrarSesion() {
    token = null;
    localStorage.removeItem("token");
    mostrarPantalla("pantalla-login");
}

// AUTH
async function iniciarSesion() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const error = document.getElementById("login-error");

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            guardarToken(data.access_token);
            document.getElementById("nav-email").textContent = email;
            mostrarPantalla("pantalla-principal");
            cargarDoctores();
            cargarCitas();
        } else {
            error.textContent = data.detail || "Credenciales incorrectas";
        }
    } catch (e) {
        error.textContent = "Error de conexión";
    }
}

async function registrarse() {
    const email = document.getElementById("registro-email").value;
    const password = document.getElementById("registro-password").value;
    const error = document.getElementById("registro-error");
    const exito = document.getElementById("registro-exito");

    try {
        const res = await fetch(`${API}/auth/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            exito.textContent = "Cuenta creada. Redirigiendo al login...";
            error.textContent = "";
            setTimeout(() => mostrarPantalla("pantalla-login"), 1500);
        } else {
            error.textContent = data.detail || "Error al registrarse";
            exito.textContent = "";
        }
    } catch (e) {
        error.textContent = "Error de conexión";
    }
}

// DOCTORES
async function cargarDoctores() {
    const lista = document.getElementById("lista-doctores");
    const select = document.getElementById("cita-doctor");

    try {
        const res = await fetch(`${API}/doctores/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const doctores = await res.json();

        if (doctores.length === 0) {
            lista.innerHTML = "<p style='color:#888;font-size:13px'>No hay doctores registrados</p>";
            select.innerHTML = "<option>Sin doctores disponibles</option>";
            return;
        }

        lista.innerHTML = doctores.map(d => `
            <div class="doctor-card">
                <div class="nombre">Dr. ${d.nombre}</div>
                <div class="especialidad">${d.especializacion}</div>
                <div class="duracion">Duración: ${d.duracion_cita} min</div>
            </div>
        `).join("");

        select.innerHTML = doctores.map(d => `
            <option value="${d.id}">Dr. ${d.nombre} — ${d.especializacion}</option>
        `).join("");

    } catch (e) {
        lista.innerHTML = "<p style='color:#e74c3c;font-size:13px'>Error cargando doctores</p>";
    }
}

async function crearDoctor() {
    const nombre = document.getElementById("doctor-nombre").value;
    const especializacion = document.getElementById("doctor-especializacion").value;
    const duracion_cita = parseInt(document.getElementById("doctor-duracion").value);
    const mensaje = document.getElementById("doctor-mensaje");

    if (!nombre || !especializacion) {
        mensaje.style.color = "#e74c3c";
        mensaje.textContent = "Completa todos los campos";
        return;
    }

    try {
        const res = await fetch(`${API}/doctores/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, especializacion, duracion_cita })
        });
        const data = await res.json();
        if (res.ok) {
            mensaje.style.color = "#27ae60";
            mensaje.textContent = "Doctor registrado exitosamente";
            document.getElementById("doctor-nombre").value = "";
            document.getElementById("doctor-especializacion").value = "";
            document.getElementById("doctor-duracion").value = "30";
            cargarDoctores();
        } else {
            mensaje.style.color = "#e74c3c";
            mensaje.textContent = data.detail || "Error al registrar";
        }
    } catch (e) {
        mensaje.style.color = "#e74c3c";
        mensaje.textContent = "Error de conexión";
    }
}

// CITAS
async function agendarCita() {
    const doctor_id = parseInt(document.getElementById("cita-doctor").value);
    const fecha_hora = document.getElementById("cita-fecha").value;
    const sintomas = document.getElementById("cita-sintomas").value;
    const urgencia = parseInt(document.getElementById("cita-urgencia").value) || null;
    const mensaje = document.getElementById("cita-mensaje");

    if (!fecha_hora) {
        mensaje.style.color = "#e74c3c";
        mensaje.textContent = "Selecciona una fecha y hora";
        return;
    }

    try {
        const res = await fetch(`${API}/citas/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                doctor_id,
                fecha_hora: new Date(fecha_hora).toISOString(),
                sintomas: sintomas || null,
                urgencia
            })
        });
        const data = await res.json();
        if (res.ok) {
            mensaje.style.color = "#27ae60";
            mensaje.textContent = "Cita agendada exitosamente";
            document.getElementById("cita-fecha").value = "";
            document.getElementById("cita-sintomas").value = "";
            cargarCitas();
        } else {
            mensaje.style.color = "#e74c3c";
            mensaje.textContent = data.detail || "Error al agendar";
        }
    } catch (e) {
        mensaje.style.color = "#e74c3c";
        mensaje.textContent = "Error de conexión";
    }
}

async function cargarCitas() {
    const lista = document.getElementById("lista-citas");

    try {
        const res = await fetch(`${API}/citas/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const citas = await res.json();

        if (citas.length === 0) {
            lista.innerHTML = "<p style='color:#888;font-size:13px'>No tienes citas agendadas</p>";
            return;
        }

        lista.innerHTML = citas.map(c => `
            <div class="cita-card">
                <div class="fecha">${new Date(c.fecha_hora).toLocaleString("es-CO")}</div>
                <div class="doctor-nombre">Dr. ${c.doctor.nombre} — ${c.doctor.especializacion}</div>
                ${c.sintomas ? `<div style="font-size:13px;color:#555;margin-top:4px">${c.sintomas}</div>` : ""}
                <span class="estado estado-${c.estado}">${c.estado}</span>
            </div>
        `).join("");

    } catch (e) {
        lista.innerHTML = "<p style='color:#e74c3c;font-size:13px'>Error cargando citas</p>";
    }
}

// INICIO
if (token) {
    mostrarPantalla("pantalla-principal");
    cargarDoctores();
    cargarCitas();
} else {
    mostrarPantalla("pantalla-login");
}