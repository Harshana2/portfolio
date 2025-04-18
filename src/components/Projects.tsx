const Projects = () => {
    return (
      <section id="projects" className="bg-gray-100 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8">Projects</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-2">🏎️ Vehicle Rental Website</h3>
              <p>
                A full-featured booking platform with custom payment gateway integration, vehicle listings, and quotation generation.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-2">💪 Gym Tracking Web App</h3>
              <p>
                Built with React and Spring Boot. Includes member login, BMI calculator, and real-time meal plan tracking with coach interaction.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-2">📊 Data Analytics Dashboard</h3>
              <p>
                Created for internal reporting using Python, MongoDB, and React. Supports dynamic filters and real-time charts.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  export default Projects;
  