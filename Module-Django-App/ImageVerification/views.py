from django.http import HttpResponse
import requests
from PIL import Image
from django.shortcuts import render
import base64
import io

import json
def home(request):
    response = requests.get('http://localhost:5000/Posts/getImages')
    data = response.json()
    if request.method == "POST":
        return HttpResponse(data[0])
    if request.method == "GET":
        print(data[0]["img"]["data"])
        return HttpResponse(str(data[0]['img']['data']))
    



def yosra(request):
    
    # Retrieve the list of images from http://localhost:5000/Posts/getImages
    response = requests.get('http://localhost:5000/Posts/getImages?page=2')
    
    # Extract the image data from the response
    image_data = io.BytesIO(response.content).getvalue()

    # Return the image data as the response
    return HttpResponse(image_data, content_type='image/jpeg')