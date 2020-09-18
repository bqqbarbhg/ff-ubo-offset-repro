# Firefox WebGL2 UBO bug repro

Open `index.html` and try different uniform buffer offsets.
On Firefox using Nvidia/Windows any offset over the maximum UBO _size_ limit of 64kB
renders the draw second triangle white.
