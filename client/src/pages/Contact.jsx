import { Helmet } from 'react-helmet-async';
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
import FacebookIcon from '../components/ui/FacebookIcon';

const Contact = () => (
  <>
    <Helmet>
      <title>Contact — UrbanCart</title>
    </Helmet>
    <div className="pt-28 pb-16">
      <div className="container-uc px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Reach Out</p>
          <h1 className="font-display text-4xl md:text-5xl mb-4">Contact Us</h1>
          <p className="text-brand-muted max-w-md mx-auto">
            We're here to help with orders, product questions, and support.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: MessageCircle,
              title: 'WhatsApp',
              desc: '+880 1700-000000',
              href: 'https://wa.me/8801700000000',
            },
            {
              icon: FacebookIcon,
              title: 'Facebook',
              desc: 'facebook.com/urbancart',
              href: 'https://facebook.com',
            },
            {
              icon: Phone,
              title: 'Messenger',
              desc: 'Chat with us',
              href: 'https://m.me/urbancart',
            },
            {
              icon: Mail,
              title: 'Email',
              desc: 'hello@urbancart.com',
              href: 'mailto:hello@urbancart.com',
            },
            {
              icon: Phone,
              title: 'Phone',
              desc: '+880 1700-000000',
              href: 'tel:+8801700000000',
            },
            {
              icon: MapPin,
              title: 'Location',
              desc: 'Dhaka, Bangladesh',
              href: '#',
            },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="bg-white border border-brand-border rounded-2xl p-6 text-center hover:shadow-lg hover:border-brand-gold/40 transition group"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-black transition">
                <item.icon size={22} />
              </div>
              <h3 className="font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-brand-muted">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default Contact;
