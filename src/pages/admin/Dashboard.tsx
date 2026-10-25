import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Button, Form, Icon, Label, Loader, Message, Modal, Table } from "semantic-ui-react";
import { ApiError } from "../../api/http";
import type { UserRecord } from "../../api/user";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";

const errorText = (error: unknown) => (error instanceof Error ? error.message : "Ocurrió un error inesperado");

const createSchema = Yup.object({
  username: Yup.string().required("El username es obligatorio").min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres").matches(/^[\w.@+-]+$/, "Sin espacios ni símbolos raros"),
  email: Yup.string().email("Correo electrónico no válido").max(254).required("El correo es obligatorio"),
  first_name: Yup.string().max(30, "Máximo 30 caracteres"),
  last_name: Yup.string().max(30, "Máximo 30 caracteres"),
  password: Yup.string().required("La contraseña es obligatoria").min(8, "Mínimo 8 caracteres").max(64).matches(/[a-z]/, "Incluye una minúscula").matches(/[A-Z]/, "Incluye una mayúscula").matches(/\d/, "Incluye un número"),
});

// Formulario para crear un usuario (POST /users/). La contraseña viaja una vez y el servidor la guarda cifrada.
function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (user: UserRecord) => void }) {
  const { createUser } = useUser();
  const formik = useFormik({
    initialValues: { username: "", email: "", first_name: "", last_name: "", password: "", is_staff: false },
    validationSchema: createSchema,
    validateOnChange: false,
    onSubmit: async (values, { setErrors, setSubmitting, resetForm }) => {
      try {
        const user = await createUser(values);
        toast.success(`Usuario ${user.username} creado`);
        onCreated(user);
        resetForm();
        onClose();
      } catch (error) {
        if (error instanceof ApiError && error.fields) setErrors(error.fields);
        toast.error(errorText(error));
      } finally {
        setSubmitting(false);
      }
    },
  });
  const err = (name: keyof typeof formik.values) => ((formik.touched[name] || formik.submitCount > 0) && formik.errors[name] ? String(formik.errors[name]) : undefined);

  return (
    <Modal open={open} onClose={onClose} size="tiny" role="dialog" aria-modal="true" aria-label="Nuevo usuario">
      <Modal.Header>Nuevo usuario</Modal.Header>
      <Modal.Content>
        <Form id="create-user-form" onSubmit={formik.handleSubmit} noValidate>
          <Form.Input label="Nombre de usuario" id="new-user-username" name="username" maxLength={20} value={formik.values.username} onChange={formik.handleChange} onBlur={formik.handleBlur} error={err("username")} />
          <Form.Input label="Correo electrónico" id="new-user-email" name="email" type="email" maxLength={254} value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} error={err("email")} />
          <Form.Group widths="equal">
            <Form.Input label="Nombre" id="new-user-first_name" name="first_name" maxLength={30} value={formik.values.first_name} onChange={formik.handleChange} error={err("first_name")} />
            <Form.Input label="Apellido" id="new-user-last_name" name="last_name" maxLength={30} value={formik.values.last_name} onChange={formik.handleChange} error={err("last_name")} />
          </Form.Group>
          <Form.Input label="Contraseña" id="new-user-password" name="password" type="password" autoComplete="new-password" maxLength={64} value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} error={err("password")} />
          <Form.Checkbox label="Es administrador" checked={formik.values.is_staff} onChange={(_, data) => formik.setFieldValue("is_staff", Boolean(data.checked))} />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button type="button" onClick={onClose} content="Cancelar" />
        <Button type="submit" form="create-user-form" primary content="Crear usuario" loading={formik.isSubmitting} disabled={formik.isSubmitting} />
      </Modal.Actions>
    </Modal>
  );
}

export function Dashboard() {
  const { auth } = useAuth();
  const { getUsers, updateUser, deleteUser } = useUser();
  const [users, setUsers] = useState<UserRecord[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const meId = auth?.me.id;

  const load = async () => {
    setError("");
    try {
      setUsers(await getUsers());
    } catch (e) {
      setError(errorText(e));
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const replace = (updated: UserRecord) => setUsers((list) => list?.map((u) => (u.id === updated.id ? updated : u)) ?? null);

  // PATCH solo con el campo que cambia: la contraseña no se toca (en el manual se sobrescribía).
  const toggleActive = async (user: UserRecord) => {
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active });
      replace(updated);
      toast.success(updated.is_active ? "Usuario activado" : "Usuario desactivado");
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const remove = async (user: UserRecord) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(user.id);
      setUsers((list) => list?.filter((u) => u.id !== user.id) ?? null);
      toast.success("Usuario eliminado");
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard__head">
        <div>
          <h1>Usuarios</h1>
          <p>{users ? `${users.length} usuarios registrados` : "Cargando…"}</p>
        </div>
        <Button primary icon labelPosition="left" onClick={() => setCreating(true)}>
          <Icon id="new-user-plus" name="plus" /> Nuevo usuario
        </Button>
      </div>

      {error && (
        <Message negative>
          <Message.Header>No pudimos cargar los usuarios</Message.Header>
          <p>{error}</p>
          <Button onClick={load} content="Intentar de nuevo" />
        </Message>
      )}
      {!users && !error && <Loader active inline="centered" />}

      {users && (
        <div className="dashboard__table">
          <Table celled striped unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Usuario</Table.HeaderCell>
                <Table.HeaderCell>Correo</Table.HeaderCell>
                <Table.HeaderCell>Nombre</Table.HeaderCell>
                <Table.HeaderCell>Rol</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Registro</Table.HeaderCell>
                <Table.HeaderCell textAlign="center">Acciones</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user) => {
                const isMe = user.id === meId;
                return (
                  <Table.Row key={user.id} negative={!user.is_active}>
                    <Table.Cell>{user.id}</Table.Cell>
                    <Table.Cell><b>{user.username}</b> {isMe && <Label size="mini" content="Tú" />}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}</Table.Cell>
                    <Table.Cell><Label color={user.is_staff ? "red" : undefined} content={user.is_staff ? "Admin" : "Cliente"} /></Table.Cell>
                    <Table.Cell><Label color={user.is_active ? "green" : "grey"} content={user.is_active ? "Activo" : "Inactivo"} /></Table.Cell>
                    <Table.Cell>{new Date(user.date_joined).toLocaleDateString("es-MX")}</Table.Cell>
                    <Table.Cell textAlign="center">
                      <Button icon size="small" title={user.is_active ? "Desactivar" : "Activar"} disabled={isMe} onClick={() => toggleActive(user)}>
                        <Icon name={user.is_active ? "toggle on" : "toggle off"} />
                      </Button>
                      <Button icon size="small" negative title="Eliminar" disabled={isMe} onClick={() => remove(user)}>
                        <Icon id="new-user-trash" name="trash" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      )}

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onCreated={(user) => setUsers((list) => (list ? [...list, user] : [user]))} />
    </div>
  );
}
