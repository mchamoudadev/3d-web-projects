import { ArrowDown, ArrowUpRight } from 'lucide-react';
import ScrollStory from '@/components/scroll-story';

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#ingredients">
        Skip the scroll story
      </a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Slice home">
          slice<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#ingredients">Nothing to hide</a>
          <a href="#our-story">Our story</a>
          <a className="nav-cta" href="#find">
            Find your Slice <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main id="top">
        <ScrollStory />
        <section className="ingredients content-section" id="ingredients">
          <p className="eyebrow">The whole ingredient list</p>
          <div className="ingredient-heading">
            <h2>
              Watermelon<span>.</span>
            </h2>
            <span className="percent">100%</span>
          </div>
          <div className="ingredient-bottom">
            <p>No sugar, no water, no concentrate.</p>
            <a href="#our-story">
              A little more about us <ArrowDown size={18} />
            </a>
          </div>
        </section>
        <section className="our-story content-section" id="our-story">
          <p className="eyebrow">One fruit, one bottle.</p>
          <h2>
            Good things grow
            <br />
            under the sun.
          </h2>
          <p>
            Hand-selected fruit, cut at peak ripeness. Cold pressed. Bottled
            within hours.
          </p>
        </section>
        <section className="find-section content-section" id="find">
          <p className="eyebrow">Cool, from the first sip.</p>
          <h2>
            Meet your
            <br />
            sunny side.
          </h2>
          <p>
            Slice is a demo brand created for a Dugsiiye tutorial.
            <br />
            No shops just yet. A little inspiration, bottled.
          </p>
          <a className="pill-link" href="#top">
            Back to the first slice <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <a className="wordmark" href="#top">
          slice.
        </a>
        <p>A Dugsiiye demo. Made for the story.</p>
        <span>One fruit. All good.</span>
      </footer>
    </>
  );
}
