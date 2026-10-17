# Maps the Garbage Dataset's 10 fine-grained classes to 3 disposal bins.
# Edit this to match local rules -- no retraining needed.
BIN_OF = {
    "biological": "compost",
    "cardboard": "recycling",
    "glass": "recycling",
    "metal": "recycling",
    "paper": "recycling",
    "plastic": "recycling",
    "clothes": "trash",
    "shoes": "trash",
    "trash": "trash",
    "battery": "trash",  # not curbside-safe either way; the app warns separately
}
BINS = ["compost", "recycling", "trash"]

BIN_DISPLAY = {
    "compost": "🟢 COMPOST",
    "recycling": "🔵 RECYCLING",
    "trash": "⚫ TRASH",
}

# Fine classes that get an extra warning regardless of bin
WARN = {"battery": "🔋 Batteries are hazardous — take to a battery drop-off if you can."}
