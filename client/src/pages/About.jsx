import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const About = () => (
  <>
    <Helmet>
      <title>About Us — UrbanCart</title>
    </Helmet>
    <div className="pt-6 pb-16">
      <div className="container-uc px-4 sm:px-6 lg:px-8 max-w-3xl">
        <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Our Story</p>
        <h1 className="font-display text-4xl md:text-5xl mb-8">About UrbanCart</h1>
        <div className="prose prose-neutral space-y-5 text-brand-muted leading-relaxed">
          <p>
            UrbanCart was founded with a simple mission: bring premium men's accessories to
            Bangladesh with honesty, style, and convenience. We believe every gentleman deserves
            products that look sharp and last long — without the hassle of uncertain quality.
          </p>
          <p>
            From precision watches and leather wallets to car looking glasses and interior
            accessories, every item in our catalog is carefully selected. We stand behind Cash on
            Delivery so you can shop with confidence.
          </p>
          <p>
            Whether you're upgrading your everyday carry or gifting someone special, UrbanCart is
            here to elevate the details.
          </p>
        </div>
        <Link to="/products" className="btn-primary mt-10 inline-flex">
          Explore Collection
        </Link>
      </div>
    </div>
  </>
);

export default About;
