import { lang, useImageText, textImageBase } from 'download0/languages'
import { libc_addr } from 'download0/userland'
import { fn, BigInt } from 'download0/types'

(function () {
  include('languages.js')
  log('Loading grid menu...')

  let currentButton = 0
  const buttonFrames: Image[] = []
  const buttonIcons: Image[] = []
  const buttonTexts: jsmaf.Text[] = []
  const buttonMarkers: Image[] = []
  const buttonOrigPos: { x: number, y: number }[] = []
  const textOrigPos: { x: number, y: number }[] = []

  const normalButtonImg   = 'file:///assets/img/icon_bg_normal.png'
  const selectedButtonImg = 'file:///assets/img/icon_bg_selected.png'
  const exitNormalImg     = 'file:///assets/img/power_off.png'
  const exitSelectedImg   = 'file:///assets/img/power_selected.png'

  jsmaf.root.children.length = 0
  new Style({ name: 'white', color: 'white', size: 18 })

  if (typeof startBgmIfEnabled === 'function') startBgmIfEnabled()

  const background = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: 0, y: 0, width: 1920, height: 1080
  })
  jsmaf.root.children.push(background)

  // ==================== MENU SEÇENEKLERİ ====================
  const menuOptions = [
    { label: 'Catalina HD',           script: 'loader.js',       imgKey: 'catalina_icon' },
    { label: 'Install macOS Ventura', script: 'payload_host.js', imgKey: 'ventura_icon'  }
  ]

  const centerX       = 960
  const startY        = 400
  const iconSize      = 260
  const iconInner     = iconSize - 60   // 200 — iç ikon boyutu
  const iconInnerOff  = 30              // iç ikonun frame içindeki offset
  const horizontalGap = 80
  const totalWidth    = (menuOptions.length * iconSize) + ((menuOptions.length - 1) * horizontalGap)
  const startX        = centerX - totalWidth / 2

  for (let i = 0; i < menuOptions.length; i++) {
    const btnX = startX + i * (iconSize + horizontalGap)
    const btnY = startY

    // 1. frame
    const frame = new Image({
      url: normalButtonImg,
      x: btnX, y: btnY,
      width: iconSize, height: iconSize
    })
    buttonFrames.push(frame)
    jsmaf.root.children.push(frame)

    // 2. İç İkon
    const icon = new Image({
      url: textImageBase + menuOptions[i]!.imgKey + '.png',
      x: btnX + iconInnerOff,
      y: btnY + iconInnerOff,
      width: iconInner,
      height: iconInner
    })
    buttonIcons.push(icon)
    jsmaf.root.children.push(icon)

    // 3. Seçim Oku
    const marker = new Image({
      url: 'file:///assets/img/arrow_selection.png',
      x: btnX + iconSize / 2 - 25,
      y: btnY + iconSize + 20,
      width: 50, height: 50,
      visible: false
    })
    buttonMarkers.push(marker)
    jsmaf.root.children.push(marker)

    // 4. Alt Yazı
    const text = new jsmaf.Text()
    text.text  = menuOptions[i]!.label
    text.style = 'white'
    text.x     = btnX + (iconSize / 2) - (text.text.length * 9)
    text.y     = btnY + iconSize + 85
    buttonTexts.push(text)
    jsmaf.root.children.push(text)

    buttonOrigPos.push({ x: btnX, y: btnY })
    textOrigPos.push({ x: text.x, y: text.y })
  }

  // ==================== EXIT BUTONU ====================
  const exitX = centerX - 40
  const exitY = 940

  const exitFrame = new Image({
    url: exitNormalImg,
    x: exitX, y: exitY, width: 80, height: 80
  })
  buttonFrames.push(exitFrame)
  jsmaf.root.children.push(exitFrame)

  buttonIcons.push(new Image({ url: '', x: 0, y: 0, width: 0, height: 0, visible: false }))
  buttonMarkers.push(new Image({ url: '', x: 0, y: 0, width: 0, height: 0, visible: false }))
  buttonTexts.push(new jsmaf.Text())
  buttonOrigPos.push({ x: exitX, y: exitY })
  textOrigPos.push({ x: exitX, y: exitY })

  // ==================== ANİMASYONLAR ====================
  function easeInOut(t: number) { return (1 - Math.cos(t * Math.PI)) / 2 }

  let zoomInInterval:  number | null = null
  let zoomOutInterval: number | null = null
  let prevButton = -1

  function animateZoomIn(i: number) {
    if (zoomInInterval) jsmaf.clearInterval(zoomInInterval)
    const duration = 175
    let elapsed    = 0
    const origX    = buttonOrigPos[i]!.x
    const origY    = buttonOrigPos[i]!.y
    const textOrigX = textOrigPos[i]!.x
    const textOrigY = textOrigPos[i]!.y

    zoomInInterval = jsmaf.setInterval(() => {
      elapsed += 16
      const t     = Math.min(elapsed / duration, 1)
      const scale = 1.0 + (0.12 * easeInOut(t))
      const offset = (iconSize * (scale - 1)) / 2

      buttonFrames[i].scaleX = buttonFrames[i].scaleY = scale
      buttonFrames[i].x      = origX - offset
      buttonFrames[i].y      = origY - offset

      buttonIcons[i].scaleX = buttonIcons[i].scaleY = scale
      buttonIcons[i].x      = origX + iconInnerOff - offset
      buttonIcons[i].y      = origY + iconInnerOff - offset

      buttonTexts[i].x = textOrigX - offset
      buttonTexts[i].y = textOrigY + offset

      if (t >= 1) { jsmaf.clearInterval(zoomInInterval!); zoomInInterval = null }
    }, 16)
  }

  function animateZoomOut(i: number) {
    if (zoomOutInterval) jsmaf.clearInterval(zoomOutInterval)
    const duration = 175
    let elapsed    = 0
    const origX    = buttonOrigPos[i]!.x
    const origY    = buttonOrigPos[i]!.y
    const textOrigX = textOrigPos[i]!.x
    const textOrigY = textOrigPos[i]!.y

    // DÜZELTME 3: Webkit uyumluluğu için ?? yerine || kullanıldı
    const startScale = buttonFrames[i].scaleX || 1.12

    zoomOutInterval = jsmaf.setInterval(() => {
      elapsed += 16
      const t     = Math.min(elapsed / duration, 1)
      const scale = startScale - ((startScale - 1.0) * easeInOut(t))
      const offset = (iconSize * (scale - 1)) / 2

      buttonFrames[i].scaleX = buttonFrames[i].scaleY = scale
      buttonFrames[i].x      = origX - offset
      buttonFrames[i].y      = origY - offset

      buttonIcons[i].scaleX = buttonIcons[i].scaleY = scale
      buttonIcons[i].x      = origX + iconInnerOff - offset
      buttonIcons[i].y      = origY + iconInnerOff - offset

      buttonTexts[i].x = textOrigX - offset
      buttonTexts[i].y = textOrigY + offset

      if (t >= 1) { jsmaf.clearInterval(zoomOutInterval!); zoomOutInterval = null }
    }, 16)
  }

  // ==================== HIGHLIGHT ====================
  function updateHighlight() {
    // Önceki butonu normale çevir ve animasyonu başlat
    if (prevButton !== -1 && prevButton !== currentButton) {
      if (prevButton === buttonFrames.length - 1) {
        buttonFrames[prevButton].url = exitNormalImg
      } else {
        buttonFrames[prevButton].url = normalButtonImg
        animateZoomOut(prevButton)
      }
      if (buttonMarkers[prevButton]) buttonMarkers[prevButton].visible = false
    }

    // DÜZELTME 2: Hızlı tuşa basılınca yarım kalan animasyonları temizlemek için diğer butonları sıfırla
    for (let i = 0; i < buttonFrames.length; i++) {
        if (i !== currentButton && i !== prevButton && i !== buttonFrames.length - 1) {
            buttonFrames[i].url = normalButtonImg
            buttonFrames[i].scaleX = buttonFrames[i].scaleY = 1.0
            buttonFrames[i].x = buttonOrigPos[i]!.x
            buttonFrames[i].y = buttonOrigPos[i]!.y

            buttonIcons[i].scaleX = buttonIcons[i].scaleY = 1.0
            buttonIcons[i].x = buttonOrigPos[i]!.x + iconInnerOff
            buttonIcons[i].y = buttonOrigPos[i]!.y + iconInnerOff

            buttonTexts[i].x = textOrigPos[i]!.x
            buttonTexts[i].y = textOrigPos[i]!.y
            
            if (buttonMarkers[i]) buttonMarkers[i].visible = false
        }
    }

    // Seçili butonu büyüt
    if (currentButton === buttonFrames.length - 1) {
      buttonFrames[currentButton].url = exitSelectedImg
    } else {
      buttonFrames[currentButton].url = selectedButtonImg
      if (buttonMarkers[currentButton]) buttonMarkers[currentButton].visible = true
      animateZoomIn(currentButton)
    }

    prevButton = currentButton
  }

  // DÜZELTME 1: Orijinal tema ve dosya yükleme yolları geri eklendi
  function handleButtonPress() {
    if (currentButton === buttonFrames.length - 1) {
      include('includes/kill_vue.js')
    } else {
      const selectedOption = menuOptions[currentButton]
      if (!selectedOption) return

      if (selectedOption.script === 'loader.js') {
        jsmaf.onKeyDown = function () {}
      }
      log('Loading ' + selectedOption.script + '...')
      
      try {
        if (selectedOption.script.includes('loader.js')) {
          include(selectedOption.script)
        } else {
          // payload_host.js gibi dosyaların temanın klasöründen yüklenmesi gerekir
          include('themes/' + (typeof CONFIG !== 'undefined' && CONFIG.theme ? CONFIG.theme : 'default') + '/' + selectedOption.script)
        }
      } catch (e) {
        log('ERROR loading ' + selectedOption.script + ': ' + (e as Error).message)
      }
    }
  }

  // ==================== INPUT ====================
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttonFrames.length
      updateHighlight()
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttonFrames.length) % buttonFrames.length
      updateHighlight()
    } else if (keyCode === 14) {
      handleButtonPress()
    }
  }

  updateHighlight()
  log('Grid menu loaded.')
})()
