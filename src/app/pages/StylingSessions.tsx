import React, { useState } from 'react';
import { PlaceholderImage } from '../components/PlaceholderImage';

export function StylingSessions() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center bg-[#EAE7E0]">
        <div className="absolute inset-0 z-0">
          <PlaceholderImage text="STYLING SESSION HERO" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-xl bg-[#F9F8F6]/90 backdrop-blur p-12">
            <h1 className="text-4xl font-serif mb-4">Personal Styling Sessions</h1>
            <p className="text-[#737373] leading-relaxed">
              Let us help you create a space that feels authentically yours. Our interior styling team offers personalized guidance, from selecting the right fabric to planning a full room layout.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-serif text-center mb-16">How We Can Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
            {[
              { title: 'Spatial Planning', desc: 'Expert advice on layouts and flow.' },
              { title: 'Styling Guidance', desc: 'Selecting colors, materials, and finishing touches.' },
              { title: 'Personal Shopping', desc: 'Curated product recommendations.' },
              { title: 'Virtual Tours', desc: '3D visualizations of your space.' },
              { title: 'Made-to-Order', desc: 'Consultation on custom fabrics and configurations.' },
              { title: 'Full Room Design', desc: 'Comprehensive styling from start to finish.' }
            ].map((service, i) => (
              <div key={i}>
                <div className="w-16 h-16 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="font-serif text-xl">{i + 1}</span>
                </div>
                <h3 className="font-medium text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-[#737373]">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Cards & Form */}
      <section className="py-20 bg-[#F9F8F6]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto">
            
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-serif mb-8">Choose Your Session</h2>
              <div className="space-y-6">
                <div className="border border-[#2D2D2D] p-8 cursor-pointer hover:bg-[#EAE7E0] transition-colors bg-white">
                  <h3 className="font-serif text-xl mb-2">Online Consultation</h3>
                  <p className="text-sm text-[#737373] mb-4">A 45-minute video call with one of our stylists. Perfect for quick questions or initial spatial planning.</p>
                  <span className="text-xs font-medium tracking-widest uppercase">Free</span>
                </div>
                <div className="border border-[#EAE7E0] p-8 cursor-pointer hover:border-[#2D2D2D] transition-colors bg-white">
                  <h3 className="font-serif text-xl mb-2">Showroom Visit</h3>
                  <p className="text-sm text-[#737373] mb-4">A 1-hour session in our flagship showroom. Feel the fabrics and see the pieces in person.</p>
                  <span className="text-xs font-medium tracking-widest uppercase">Free</span>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 bg-white p-10 border border-[#EAE7E0]">
              <h2 className="text-2xl font-serif mb-8">Book an Appointment</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#EAE7E0] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✓</div>
                  <h3 className="text-2xl font-serif mb-4">Request Received</h3>
                  <p className="text-[#737373]">Thank you. Our styling team will be in touch shortly to confirm your appointment date and time.</p>
                  <button onClick={() => setIsSubmitted(false)} className="mt-8 text-sm font-medium tracking-widest uppercase underline">Book another session</button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">First Name</label>
                      <input required type="text" className="w-full border border-[#EAE7E0] p-3 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Last Name</label>
                      <input required type="text" className="w-full border border-[#EAE7E0] p-3 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Email</label>
                    <input required type="email" className="w-full border border-[#EAE7E0] p-3 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Room Type</label>
                      <select className="w-full border border-[#EAE7E0] p-3 bg-transparent focus:outline-none focus:border-[#2D2D2D] appearance-none">
                        <option>Living Room</option>
                        <option>Bedroom</option>
                        <option>Dining Room</option>
                        <option>Full Home</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Preferred Date</label>
                      <input type="date" className="w-full border border-[#EAE7E0] p-3 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Notes about your project</label>
                    <textarea rows={4} className="w-full border border-[#EAE7E0] p-3 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
                  </div>
                  <button type="submit" className="w-full bg-[#2D2D2D] text-white py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors mt-4">
                    Submit Request
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
