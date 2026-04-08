'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FaqItem {
  title: string;
  text: string;
}

export type FaqItems = Array<FaqItem>;

export function Faq() {
  const items: FaqItems = [
    {
      title: 'How is pricing determined for each plan ?',
      text: "AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow. AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow. AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow",
    },
    {
      title: 'What payment methods are accepted for subscriptions ?',
      text: "AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow",
    },
    {
      title: 'Are there any hidden fees in the pricing ?',
      text: "AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow",
    },
    {
      title: 'Is there a discount for annual subscriptions ?',
      text: "AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow",
    },
    {
      title: 'Do you offer refunds on subscription cancellations ?',
      text: "AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow",
    },
    {
      title: 'Can I add extra features to my current plan ?',
      text: "AI Dev Brain provides flexible options for managing your project intelligence. Understanding the features available helps you make the most of your development workflow",
    },
  ];

  const generateItems = () => {
    return (
      <Accordion type="single" collapsible>
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.text}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ</CardTitle>
      </CardHeader>
      <CardContent className="py-3">{generateItems()}</CardContent>
    </Card>
  );
}
