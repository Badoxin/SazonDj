import { Link, useNavigate } from "react-router-dom";
import { Button, Form } from "semantic-ui-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ApiError } from "../../api/http";
import { registerApi } from "../../api/user";

// Las mismas reglas que valida Django (el servidor vuelve a validar todo; esto solo avisa más rápido).
const validationSchema = Yup.object({
  username: Yup.string()
    .required("El username es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .matches(/^[\w.@+-]+$/, "Solo letras, números y . @ + - _ (sin espacios)"),
  email: Yup.string().email("Correo electrónico no válido").max(254, "Máximo 254 caracteres").required("El correo electrónico es obligatorio"),
  password: Yup.string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(64, "Máximo 64 caracteres")
    .matches(/[a-z]/, "Incluye una minúscula")
    .matches(/[A-Z]/, "Incluye una mayúscula")
    .matches(/\d/, "Incluye un número"),
  password_confirm: Yup.string()
    .required("Confirma tu contraseña")
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden"),
});

export function Register() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { username: "", email: "", password: "", password_confirm: "" },
    validationSchema,
    validateOnChange: false,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        await registerApi(values);
        toast.success("Cuenta creada. Ahora inicia sesión.");
        navigate("/login");
      } catch (error) {
        // Errores por campo que manda Django (por ejemplo, "Ya existe un usuario con este correo.")
        if (error instanceof ApiError && error.fields) setErrors(error.fields);
        toast.error(error instanceof Error ? error.message : "No pudimos crear la cuenta");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Se muestra el error de un campo cuando ya lo tocaron o ya intentaron enviar el formulario.
  const field = (name: keyof typeof formik.values) =>
    (formik.touched[name] || formik.submitCount > 0) && formik.errors[name] ? formik.errors[name] : undefined;

  return (
    <div className="auth-page register-admin">
      <div className="auth-page__content">
        <h1>Crear cuenta</h1>
        <p className="auth-page__subtitle">Únete a SAZÓN</p>
        <Form className="register-form-admin" onSubmit={formik.handleSubmit} noValidate>
          <Form.Input
            label="Nombre de usuario"
            id="register-username" name="username"
            placeholder="tu_usuario"
            autoComplete="username"
            maxLength={20}
            value={formik.values.username}
            onChange={(_, { value }) => formik.setFieldValue("username", String(value).replace(/\s/g, ""))} // sin espacios
            onBlur={formik.handleBlur}
            error={field("username")}
          />
          <Form.Input
            label="Correo electrónico"
            id="register-email" name="email"
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            maxLength={254}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={field("email")}
          />
          <Form.Input
            label="Contraseña"
            id="register-password" name="password"
            type="password"
            placeholder="Mínimo 8 caracteres, con mayúscula, minúscula y número"
            autoComplete="new-password"
            maxLength={64}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={field("password")}
          />
          <Form.Input
            label="Confirmar contraseña"
            id="register-password_confirm" name="password_confirm"
            type="password"
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            maxLength={64}
            value={formik.values.password_confirm}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={field("password_confirm")}
          />
          <Button type="submit" content="Crear cuenta" primary fluid loading={formik.isSubmitting} disabled={formik.isSubmitting} />
        </Form>
        <p className="auth-page__links">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
