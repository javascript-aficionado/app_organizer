import sys

def normalize(url):
    temp = url.split('/')
    return temp[len(temp) - 1].split('.')[0]

if __name__ == '__main__':
   sys.stdout.write(normalize(sys.argv[1]))
   sys.stdout.flush()