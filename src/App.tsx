import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';

const App = () => {
  return (
    <div className="font-sans text-gray-800 bg-white">
      <Hero />
      <About />
      <Projects />
      <Contact />
    </div>
  );
};

export default App;
