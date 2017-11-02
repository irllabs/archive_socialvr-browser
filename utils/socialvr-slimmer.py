import yaml
import sys
import os
from pydub import AudioSegment
from PIL import Image
import zipfile
from shutil import make_archive as shutil

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file))

def inplace_change(filename, old_string, new_string):
    # Safely read the input filename using 'with'
    with open(filename) as f:
        s = f.read()
        if old_string not in s:
            #print '"{old_string}" not found in {filename}.'.format(**locals())
            return

    # Safely write the changed content, if found in the file
    with open(filename, 'w') as f:
        #print 'Changing "{old_string}" to "{new_string}" in {filename}'.format(**locals())
        s = s.replace(old_string, new_string)
        f.write(s)

# get file name and dir names
zipFile = sys.argv[1]
zipDir = os.getcwd()
zipFileBase = os.path.splitext(os.path.basename(zipFile))[0]
zipFileNew = zipFileBase+"_slim.zip"
yamlPath = zipFileBase+'/'+'story.yml'

# unzip project
os.mkdir(zipFileBase)
storyZip = zipfile.ZipFile(zipFile, 'r')
storyZip.extractall(zipFileBase)

# parse story.yml
f = open(zipFileBase+'/'+'story.yml')
storyDict = yaml.safe_load(f)
f.close()


# iterate thru rooms
for room in storyDict['rooms']:
    print('---')
    print(room['name'])
    roomFolder = room['uuid'] + '/'
    
    # recompress background image
    backgroundPath = zipFileBase + '/' + roomFolder + room['image']
    background = Image.open(backgroundPath)
    background.save(backgroundPath,quality=80,optimize=True)
    print("Optimizing: ", room['image'])
    
    # iterate thru audio hotspots
    for clip in room['clips']:
        clipPath = zipFileBase + '/' + roomFolder + clip['file']
        clipPathMp3 = os.path.splitext(clipPath)[0]+'.mp3'
        print("MP3-ing: ", clip['file'])
        AudioSegment.from_wav(clipPath).export(clipPathMp3, format="mp3")
        os.remove(clipPath)
        
    # check for narration
    narrateIntro = room['narrator']['intro']
    if (narrateIntro):
        narratePath = zipFileBase + '/' + roomFolder + room['narrator']['intro']
        narratePathMp3 = os.path.splitext(narratePath)[0]+'.mp3'
        #print(narratePath+ " " + narratePathMp3)
        print("MP3-ing: ", room['narrator']['intro'])
        AudioSegment.from_wav(narratePath).export(narratePathMp3, format="mp3")
        os.remove(narratePath)

# change yaml file
print("------------------------------------")
print("Revising story.yml")
inplace_change(yamlPath,".WAV",".mp3")
inplace_change(yamlPath,".wav",".mp3")
inplace_change(yamlPath,".AIF",".mp3")
inplace_change(yamlPath,".AIFF",".mp3")
inplace_change(yamlPath,".aif",".mp3")
inplace_change(yamlPath,".aiff",".mp3")

# create new zip archive
print("------------------------------------")
print("Create new zip archive: ", zipFileNew)
zipf = zipfile.ZipFile(zipFileNew,'w',zipfile.ZIP_DEFLATED)
zipdir(zipFileBase,zipf)
zipf.close()

print("DONE!")
