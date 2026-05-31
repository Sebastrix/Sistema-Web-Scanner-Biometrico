import sys
import json
import os
from deepface import DeepFace


def responder(success, message, rostro_codigo=None):
    print(json.dumps({
        "success": success,
        "message": message,
        "rostro_codigo": rostro_codigo
    }))


def main():
    if len(sys.argv) < 2:
        responder(False, "No se recibió la ruta de la imagen.")
        return

    ruta_imagen = sys.argv[1]

    if not os.path.exists(ruta_imagen):
        responder(False, "La imagen no existe.")
        return

    try:
        representacion = DeepFace.represent(
            img_path=ruta_imagen,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=True
        )

        if not representacion or len(representacion) == 0:
            responder(False, "No se detectó ningún rostro. Intenta nuevamente con buena iluminación.")
            return

        if len(representacion) > 1:
            responder(False, "Se detectó más de un rostro. Registra solo una persona.")
            return

        responder(
            True,
            "Rostro registrado correctamente.",
            "ROSTRO_VALIDADO_DEEPFACE"
        )

    except Exception as error:
        responder(False, f"No se pudo validar el rostro: {str(error)}")


if __name__ == "__main__":
    main()