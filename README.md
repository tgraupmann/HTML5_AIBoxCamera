# HTML5_AIBoxCamera

This is a HTML5 sample for running an AI model in the browser with TensorFlow. The page has a canvas that renders a web camera. The pixels are sampled and sent to the model for prediction. The top predictions are drawn on the predictionc canvas.

Note: More training data needs to be added.

* [Demo](https://theylovegames.com/HTML5_AIBoxCamera/)

## Screenshots

![image_1](images/image_1.png)

## Dependencies

* [Python Downloads](https://www.python.org/downloads/windows/)

* Note: Use `Python 3.8`. As of February 22nd 2021 TensorFlow is not compatible with `Python 3.9`.

* TensorFlow JS

```cmd
python -m pip install --upgrade pip
pip install tensorflowjs
```

## Training

```cmd
cd .\models
.\train_save_model_0.cmd
```
