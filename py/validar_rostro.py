import sys
import json
import os
from deepface import DeepFace


def responder(success, message, verified=False, distance=None, threshold=None):
    print(json.dumps({
        "success": success,
        "message": message,
        "verified": verified,
        "distance": distance,
        "threshold": threshold
    }))


def main():
    if len(sys.argv) < 3:
        responder(False, "Debe enviar la imagen registrada y la imagen actual.")
        return

    imagen_registrada = sys.argv[1]
    imagen_actual = sys.argv[2]

    if not os.path.exists(imagen_registrada):
        responder(False, "La imagen registrada no existe.")
        return

    if not os.path.exists(imagen_actual):
        responder(False, "La imagen actual no existe.")
        return

    try:
        resultado = DeepFace.verify(
            img1_path=imagen_registrada,
            img2_path=imagen_actual,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=True
        )

        verified = bool(resultado.get("verified", False))
        distance = resultado.get("distance", None)
        threshold = resultado.get("threshold", None)

        if verified:
            responder(
                True,
                "Identidad facial validada correctamente.",
                verified,
                distance,
                threshold
            )
        else:
            responder(
                False,
                "El rostro no coincide con el cliente registrado.",
                verified,
                distance,
                threshold
            )

    except Exception as error:
        responder(False, f"Error al validar identidad facial: {str(error)}")


if __name__ == "__main__":
    main()