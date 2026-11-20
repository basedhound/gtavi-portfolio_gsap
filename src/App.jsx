import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Loader from './components/Loader.jsx'
import Background from './components/Background.jsx'
import MeetTheDeveloper from './components/MeetTheDeveloper.jsx'
import Services from './components/Services.jsx'
import Miami from './components/Miami.jsx'
import Highlights from './components/Highlights.jsx'
import Clients from './components/Clients.jsx'
import Blog from './components/Blog.jsx'
import Footer from './components/Footer.jsx'

function App() {
  return (
    <>
      <Background />
      <Loader />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero />
        <MeetTheDeveloper />
        <Services />
        <Miami />
        <Highlights />
        <Clients />
        <Blog />
      </main>
      <Footer />
    </>
  )
}

export default App
