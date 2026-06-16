import os
import sys

# ==============================================================================
# CONFIGURACIÓN CRÍTICA: Silenciar logs de TensorFlow y avisos del sistema
# Esto evita que se ensucie el stdout y arruine el JSON.parse() en Node.js
# ==============================================================================
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings("ignore")

import json
from deepface import DeepFace


def responder(success, message, verified=False, distance=None, threshold=None):
    """Imprime un JSON limpio y único en la consola"""
    print(json.dumps({
        "success": success,
        "message": message,
        "verified": verified,
        "distance": distance,
        "threshold": threshold
    }))
    sys.exit(0) # Forzar la salida limpia del script


def main():
    if len(sys.argv) < 3:
        responder(False, "Debe enviar la imagen registrada y la imagen actual.")
        return

    imagen_registrada = sys.argv[1]
    imagen_actual = sys.argv[2]

    if not os.path.exists(imagen_registrada):
        responder(False, f"La imagen registrada no existe en la ruta especificada.")
        return

    if not os.path.exists(imagen_actual):
        responder(False, f"La imagen actual temporal no existe.")
        return

    try:
        # Ejecución del motor DeepFace
        resultado = DeepFace.verify(
            img1_path=imagen_registrada,
            img2_path=imagen_actual,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=True
        )

        # Extracción segura de los valores devueltos por la IA
        verified = bool(resultado.get("verified", False))
        distance = resultado.get("distance", None)
        threshold = resultado.get("threshold", None)

        # Conversión manual a flotantes nativos de Python por seguridad de tipado en JSON
        if distance is not None: distance = float(distance)
        if threshold is not None: threshold = float(threshold)

        if verified:
            responder(
                True, # success: El proceso se completó correctamente
                "Identidad facial validada correctamente.",
                verified, # true: Los rostros coinciden
                distance,
                threshold
            )
        else:
            responder(
                True, # success: TRUE porque el script terminó su análisis con éxito
                "El rostro no coincide con el cliente registrado.",
                verified, # false: Los rostros NO coinciden
                distance,
                threshold
            )

    except Exception as error:
        # Captura fallos de lectura, imágenes corruptas o si enforce_detection no halló un rostro
        responder(False, f"Error al validar identidad facial: {str(error)}")


if __name__ == "__main__":
    main()