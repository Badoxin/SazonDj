import { Link, useNavigate } from "react-router-dom";
import { Button, Form } from "semantic-ui-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { loginApi } from "../../api/user";
import { useAuth } from "../../hooks/useAuth";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Correo electrónico no válido").max(254).required("El correo electrónico es obligatorio"),
      password: Yup.string().max(64).required("La contraseña es obligatoria"),
    }),
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { access } = await loginApi(values); // el access es el token que devuelve Django
        const me = await login(access);
        navigate(me.is_staff ? "/dashboard" : "/");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al iniciar sesión");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-page__content">
        <h1>Iniciar sesión</h1>
        <p className="auth-page__subtitle">Entra para ver tu perfil</p>
        <Form className="login-form-admin" onSubmit={formik.handleSubmit} noValidate>
          <Form.Input
            label="Correo electrónico"
            id="login-email" name="email"
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            maxLength={254}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
          />
          <Form.Input
            label="Contraseña"
            id="login-password" name="password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password" // el manual usa autoComplete="false", que no es un valor válido
            maxLength={64}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
          />
          <Button type="submit" content="Iniciar sesión" primary fluid loading={formik.isSubmitting} disabled={formik.isSubmitting} />
        </Form>
        <p className="auth-page__links">
          ¿Aún no tienes cuenta? <Link to="/register">Regístrate</Link>
          <br />
          <Link to="/">Volver al sitio</Link>
        </p>
      </div>
    </div>
  );
}
