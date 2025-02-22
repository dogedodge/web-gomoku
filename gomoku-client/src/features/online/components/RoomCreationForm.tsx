import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";

import styles from "./RoomCreationForm.module.scss";
import roomSlice from "../slices/roomSlice";

// Define the shape of the form values
interface FormValues {
  roomName: string;
  maxPlayers: number;
}

// Define the validation schema using Yup
const validationSchema = Yup.object({
  roomName: Yup.string()
    .trim()
    .required("Room name is required")
    .min(3, "Room name must be at least 3 characters long")
    .max(20, "Room name must be at most 20 characters long"),
  maxPlayers: Yup.number()
    .integer("Max players must be an integer")
    .required("Max players is required")
    .min(2, "Max players must be at least 2")
    .max(10, "Max players must be at most 10"),
});

const RoomCreationForm: React.FC = () => {
  const dispatch = useDispatch();

  // Create a new room
  const handleSubmit = (values: FormValues) => {
    // dispatch(roomSlice.actions.roomCreated({
    //   roomId: null, // Assuming the backend will handle generating the room ID
    //   roomName: values.roomName,
    //   maxPlayers: values.maxPlayers,
    // }));
    // // Here you should also handle the actual room creation via API or WebSocket
    // console.log('Room Created:', values);
  };

  return (
    <div className={styles.formContainer}>
      <h2>Create a New Room</h2>
      <Formik
        initialValues={{ roomName: "", maxPlayers: 2 }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <div className={styles.fieldContainer}>
              <label htmlFor="roomName">Room Name</label>
              <Field
                type="text"
                name="roomName"
                id="roomName"
                placeholder="Enter room name"
              />
              <ErrorMessage
                name="roomName"
                component="div"
                className={styles.error}
              />
            </div>
            <div className={styles.fieldContainer}>
              <label htmlFor="maxPlayers">Max Players</label>
              <Field
                type="number"
                name="maxPlayers"
                id="maxPlayers"
                placeholder="Enter max players"
              />
              <ErrorMessage
                name="maxPlayers"
                component="div"
                className={styles.error}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              Create Room
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default RoomCreationForm;
