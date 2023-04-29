import os
import json
import numpy as np
import pathlib
import tensorflow as tf
import tensorflowjs as tfjs
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPool2D, Flatten, Dense
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Set the seed
tf.random.set_seed(42)

valid_datagen = ImageDataGenerator(rescale=1./255)

# Setup the train and test directories
save_dir = "trained_models/box_model"
image_dir = "images"
train_dir = image_dir + "/train/"
test_dir = image_dir + "/train/"

# IMG_SIZE = 256
IMG_SIZE = 32
BATCH_SIZE = 32
NUM_CHANNELS = 3
NUM_EPOCS = 50

# Create a function to import an image and resize it to be able to be used with our model


def load_and_prep_image(filename, img_shape=IMG_SIZE):
    """
    Reads an image from filename, turns it into a tensor
    and reshapes it to (img_shape, img_shape, colour_channel).
    """
    # Read in target file (an image)
    img = tf.io.read_file(filename)

    # Decode the read file into a tensor & ensure 3 colour channels
    # (our model is trained on images with 3 colour channels and sometimes images have 4 colour channels)
    img = tf.image.decode_image(img, channels=3)

    # Resize the image (to the same size our model was trained on)
    img = tf.image.resize(img, size=[img_shape, img_shape])

    # Rescale the image (get all values between 0 and 1)
    img = img/255.
    return img


valid_data = valid_datagen.flow_from_directory(test_dir,
                                               batch_size=BATCH_SIZE,
                                               target_size=(
                                                   IMG_SIZE, IMG_SIZE),
                                               class_mode="categorical",
                                               seed=42)


data_dir = pathlib.Path(train_dir)
class_names = np.array(sorted([item.name for item in data_dir.glob('*')]))
print(class_names)

NUM_CLASSES = len(class_names)

print("Number of classes:", NUM_CLASSES)


# Create our model (a clone of model_8, except to be multi-class)
model_0 = Sequential([
    # Dense(NUM_CLASSES, activation='relu',
    #      input_shape=(IMG_SIZE, IMG_SIZE, NUM_CHANNELS)),
    # Dense(NUM_CLASSES, activation='relu'),
    # Dense(NUM_CLASSES, activation='relu'),
    Conv2D(NUM_CLASSES, NUM_CHANNELS, activation='relu',
           input_shape=(IMG_SIZE, IMG_SIZE, NUM_CHANNELS)),
    Conv2D(NUM_CLASSES, NUM_CHANNELS, activation='relu'),
    MaxPool2D(),
    Conv2D(NUM_CLASSES, NUM_CHANNELS, activation='relu'),
    Conv2D(NUM_CLASSES, NUM_CHANNELS, activation='relu'),
    MaxPool2D(),
    Flatten(),
    # changed to have X neurons (same as number of classes) and 'softmax' activation
    Dense(NUM_CLASSES, activation='softmax')
])

# Compile the model
model_0.compile(loss="categorical_crossentropy",
                optimizer=tf.keras.optimizers.Adam(),
                metrics=["accuracy"])


for epoch in range(0, NUM_EPOCS):

    print("epoch:", epoch, "of", NUM_EPOCS)

    # Preprocess data (get all of the pixel values between 1 and 0, also called scaling/normalization)
    train_datagen = ImageDataGenerator(rescale=1./255,
                                       # rotate the image slightly between 0 and N degrees (note: this is an int not a float)
                                       # rotation_range=5,
                                       shear_range=0.1,  # shear the image
                                       zoom_range=0.1,  # zoom into the image
                                       width_shift_range=0.1,  # shift width ways
                                       height_shift_range=0.1,  # shift height ways
                                       brightness_range=[0.5, 1])  # brightness range

    # Import data from directories and turn it into batches
    train_data = train_datagen.flow_from_directory(train_dir,
                                                   batch_size=BATCH_SIZE,  # number of images to process at a time
                                                   target_size=(
                                                       IMG_SIZE, IMG_SIZE),
                                                   class_mode="categorical",  # type of problem we're working on
                                                   # seed=42,
                                                   shuffle=True)

    # Fit the model
    model_0.fit(train_data,
                epochs=1,
                steps_per_epoch=len(train_data),
                # validation_data=valid_data, # validate on images not in the training data
                # validation_steps=len(valid_data))
                # validate with training data to check how well it can predict on the training data
                validation_data=train_data,
                validation_steps=int(0.1 * len(valid_data)))


print("saving model...")

# os.makedirs("saved_models")  # Make directory if it doesn't exist

# Save model
tfjs.converters.save_keras_model(
    model_0, save_dir)

print("save model complete.")
