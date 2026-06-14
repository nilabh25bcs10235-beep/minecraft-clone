import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function Game() {
  const mountRef = useRef(null)

  useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth / 2, window.innerHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Basic scene
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshLambertMaterial({ color: 0x4ade80 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(5, 10, 5)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0x404040))

    camera.position.z = 5

    const animate = () => {
      requestAnimationFrame(animate)
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      mountRef.current.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}

export default Game