# Maps the model's fine-grained classes to 3 disposal bins (Seattle rules).
# Changing a class's bin needs no retraining; adding a class does.
BIN_OF = {
    "plastic_bag": "trash",  # Seattle: plastic bags, film and wrappers go in garbage
    "styrofoam": "trash",
    "biological": "compost",
    "tissue": "compost",  # Seattle: napkins, tissues, paper towels -> compost
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
