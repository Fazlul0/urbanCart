import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const About = () => (
  <>
    <Helmet>
      <title>About Us — Nogor Car</title>
    </Helmet>
    <div className="pt-6 pb-16 w-full min-w-0 overflow-x-hidden">
      <div className="container-uc px-3 sm:px-6 lg:px-8 max-w-3xl w-full min-w-0">
        <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Our Story</p>
        <h1 className="font-display text-4xl md:text-5xl mb-8">About Nogor Car</h1>
        <div className="prose prose-neutral space-y-5 text-brand-muted leading-relaxed">
          <p>
            Nogor Car was founded with a simple mission: bring quality car accessories to
            Bangladesh with honesty, style, and convenience. We believe every driver deserves
            products that look sharp and last long — without the hassle of uncertain quality.
          </p>
          <p>
            From interior accessories and looking glasses to power and care products, every item
            in our catalog is carefully selected. We stand behind Cash on Delivery so you can shop
            with confidence.
          </p>
          <p>
            Whether you&apos;re upgrading your ride or gifting a fellow driver, Nogor Car is here
            for every journey.
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
