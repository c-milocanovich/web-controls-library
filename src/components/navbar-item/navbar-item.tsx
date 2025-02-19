import { Component, Element, Host, Prop, h } from "@stencil/core";
import { Component as GxComponent, LayoutSize } from "../common/interfaces";
import {
  HighlightableComponent,
  makeHighlightable
} from "../common/highlightable";

// Class transforms
import {
  getClasses,
  HIGHLIGHT_CLASS_NAME
} from "../common/css-transforms/css-transforms";

@Component({
  shadow: true,
  styleUrl: "navbar-item.scss",
  tag: "gx-navbar-item"
})
export class NavBarItem implements GxComponent, HighlightableComponent {
  @Element() element: HTMLGxNavbarItemElement;

  /**
   * Indicates if the navbar item is the active one (for example, when the item represents the current page)
   */
  @Prop() readonly active = false;

  /**
   * A CSS class to set as the `gx-navbar-item` element class.
   */
  @Prop() readonly cssClass: string;

  /**
   * True to highlight control when an action is fired.
   */
  @Prop() readonly highlightable = true;

  /**
   * This attribute lets you specify the URL of the navbar item.
   */
  @Prop() readonly href = "";

  /**
   * This attribute lets you specify the alternate text for the image specified in iconSrc.
   */
  @Prop() readonly iconAltText = "";

  /**
   * This attribute lets you specify the src attribute of an icon for the
   * navbar item.
   */
  @Prop() readonly iconSrc: string;

  /**
   * This attribute lets you specify the srcset attribute of an icon for the
   * navbar item.
   */
  @Prop() readonly iconSrcset: string;

  /**
   * This attribute lets you specify the layout size of the application.
   * Each layout size will set different behaviors in the gx-navbar-item control.
   */
  @Prop() readonly layoutSize: LayoutSize = "large";

  componentDidLoad() {
    makeHighlightable(this);
  }

  render() {
    const TagName = this.href ? "a" : "button";
    const attris = this.href
      ? {
          href: this.href
        }
      : {
          type: "button"
        };

    // Styling for gx-navbar-item control.
    const classes = getClasses(this.cssClass);

    const shouldRenderImg = this.iconSrcset || this.iconSrc;

    return (
      <Host
        class={{
          [this.cssClass]: !!this.cssClass,
          [classes.vars]: true,
          [HIGHLIGHT_CLASS_NAME]: this.active,
          "small-layout-size": this.layoutSize === "small",
          "gx-default-button": !this.cssClass
        }}
        data-has-action
      >
        <TagName
          class={{
            "navbar-item": true,
            "navbar-item-with-icon": !!shouldRenderImg
          }}
          {...attris}
        >
          {shouldRenderImg && (
            <img
              class="navbar-item-icon"
              src={this.iconSrc || undefined}
              srcset={this.iconSrcset || undefined}
              alt={this.iconAltText}
            />
          )}
          <slot />
        </TagName>
      </Host>
    );
  }
}
