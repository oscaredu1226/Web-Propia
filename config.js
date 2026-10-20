/* Datos del portafolio. Capturas de los sitios publicados aportados por Oscar. */
window.PORTFOLIO_CONFIG = {
  name: "Oscar Eduardo Soto Zorrilla",
  shortName: "Oscar Soto",
  role: "Desarrollador full stack",
  university: "",
  // Código de país y número, solo dígitos. Perú: 51 + 9 dígitos.
  whatsapp: "51987509361",
  email: "",
  socials: {
    linkedin: "https://www.linkedin.com/in/oscar-eduardo-soto-zorrilla-74929a99",
    github: "https://github.com/oscaredu1226",
  },
  // Si existe un portafolio completo, el enlace «Ver todos» abrirá esta URL.
  allProjectsUrl: "",
  images: {
    hero: "assets/oscar-soto-retrato.png", // Foto original; el encuadre se adapta con CSS.
    about: "", // Ejemplo: assets/mi-foto-perfil.webp
  },
  projects: {
    ozon: {
      name: "OZON Terapia del Dolor",
      type: "Sitio web de salud",
      description: "Tratamientos, especialista y orientación para solicitar una consulta, en una web cercana y clara.",
      detail: "Sitio para presentar los tratamientos y el perfil del especialista. Incluye navegación por secciones, preguntas frecuentes y accesos de contacto para orientar al paciente hacia una consulta.",
      tags: ["Salud", "Tratamientos", "Contacto"],
      image: "assets/projects/ozon.jpg",
      url: "https://ozon-terapia-del-dolor.netlify.app/",
    },
    ladosis: {
      name: "La Dosis",
      type: "Sitio web de una banda",
      description: "La identidad de una banda de punk melódico, con su música, vídeos, fechas y comunidad.",
      detail: "Web de la banda peruana La Dosis. Reúne música, descargas de álbumes, vídeos, integrantes, fechas, galería y foro, con una presentación visual vinculada a la identidad de la banda.",
      tags: ["Música", "Multimedia", "Comunidad"],
      image: "assets/projects/ladosis.jpg",
      url: "https://ladosisoficial.netlify.app/",
    },
    octomon: {
      name: "OCTOMON",
      type: "Catálogo y carrito de compras",
      description: "Cartas Pokémon por colección e idioma, con disponibilidad, carrito y solicitud por WhatsApp.",
      detail: "Catálogo de cartas Pokémon con productos, precios, idioma y disponibilidad. El recorrido permite preparar un carrito y continuar la solicitud por WhatsApp para confirmar el pedido.",
      tags: ["Catálogo", "Carrito", "WhatsApp"],
      image: "assets/projects/octomon.jpg",
      url: "https://octomon.netlify.app/",
    },
    bucomaxilofacial: {
      name: "Bucomaxilofacial Perú",
      type: "Sitio web de salud",
      description: "Servicios, proceso de atención y equipo especializado, con una navegación centrada en el paciente.",
      detail: "Web de rehabilitación bucomaxilofacial oncológica. Organiza los servicios, el proceso de atención, los perfiles del equipo, las preguntas frecuentes y las opciones de contacto.",
      tags: ["Servicios", "Equipo", "Contacto"],
      image: "assets/projects/bucomaxilofacial.jpg",
      url: "https://bucomaxilofacial.netlify.app/",
    },
    tukuntech: {
      name: "TukunTech",
      type: "Landing de producto IoT",
      description: "Presentación de un proyecto de salud preventiva que conecta un dispositivo, una plataforma y sus usuarios.",
      detail: "Landing bilingüe de un proyecto en equipo sobre monitoreo preventivo con IoT. Presenta el dispositivo, la plataforma, el funcionamiento y los planes, además de acceso a la aplicación e información del equipo.",
      tags: ["IoT", "Producto", "Español e inglés"],
      image: "assets/projects/tukuntech.jpg",
      url: "https://tukuntech.github.io/LandingPage/",
    },
    "tarjeta-ozon": {
      name: "Tarjeta digital OZON",
      type: "Tarjeta de presentación digital",
      description: "Presentación profesional con servicios, ubicación y contacto en un mismo enlace. Con acceso por QR y soporte NFC como complemento.",
      detail: "Tarjeta de presentación digital para el sector salud. Organiza el perfil profesional, los servicios y la ubicación, con accesos a WhatsApp y guardado de contacto. Se comparte mediante enlace o QR y puede vincularse a una tarjeta o dispositivo NFC.",
      tags: ["Presentación", "Contacto", "NFC opcional"],
      image: "assets/projects/tarjeta-ozon.jpg",
      imageWidth: 1440,
      imageHeight: 900,
      mobileImage: "assets/projects/tarjeta-ozon-movil.jpg",
      mobileWidth: 390,
      mobileHeight: 844,
      url: "https://tarjetapersonal-ozon.netlify.app/",
    },
    "tarjeta-ciberseguridad": {
      name: "Ciberseguridad.pe",
      type: "Tarjeta de presentación corporativa",
      description: "Presentación de servicios de ciberseguridad, material corporativo y canales de contacto. Compatible con un soporte NFC opcional.",
      detail: "Tarjeta de presentación digital para una empresa de ciberseguridad. Reúne servicios, material corporativo y accesos a contacto, web y LinkedIn. Se puede compartir por enlace y vincular a tarjetas o dispositivos NFC como complemento.",
      tags: ["Presentación", "Servicios", "NFC opcional"],
      image: "assets/projects/tarjeta-ciberseguridad.jpg",
      imageWidth: 1440,
      imageHeight: 900,
      mobileImage: "assets/projects/tarjeta-ciberseguridad-movil.jpg",
      mobileWidth: 390,
      mobileHeight: 844,
      url: "https://tarjetas-ciberseguridadpe.netlify.app/p/ricardo-lanatta-forger",
    },
  },
  // Añade únicamente reseñas reales y autorizadas.
  // { quote: "…", name: "Nombre", context: "Proyecto o empresa" }
  testimonials: [],
};
